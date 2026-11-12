'use client';

// SPACE CADET: four spatial puzzles as one run (owner, 2026-11-07).
//
// Roll, Parker, Tangled, then Topple (lib/space-cadet.js), back to back on one
// page, then a rank from Lost in Space up to Architect-Engineer. "Space Cadet"
// is the run's name, never a rung. Time decides: each solved leg pays up to
// 100 for speed, so the run total is the clock read backwards.
//
// EACH PUZZLE IS THE REAL GAME, mounted inside app/RunEmbed.jsx, exactly as it
// plays on its own page (owner, 2026-11-07: keep Roll's and Topple's play
// style, "they are great"). The start, the save and the /api/quiz/result row
// are that game's own, so the run leaves exactly what four separate plays
// would, and the circuit board (scorer 'spacecadet') adds those rows up with
// the same scorer used here. A puzzle already finished today on its own page
// is not replayed: its first result stands.
//
// Forked from app/crossed/CrossedClient.jsx (the run stage: entry, play frame,
// handover, ending), in the approved mockup's colours: a sky ground, and each
// leg on its own band colour (Roll rose, Parker gold, Tangled mint, Topple violet).

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
import { SPACE_RUN_ID, SPACE_RANKS, SPACE_MAX, SPACE_LEG_MAX, SPACE_CAP, spaceTierOf, spaceLegPoints } from '@/lib/space-cadet';

const CLIENTS = {
  roll: dynamic(() => import('../roll/RollClient'), { ssr: false, loading: () => null }),
  park: dynamic(() => import('../parker/ParkerClient'), { ssr: false, loading: () => null }),
  tangled: dynamic(() => import('../tangled/TangledClient'), { ssr: false, loading: () => null }),
  topple: dynamic(() => import('../topple/ToppleClient'), { ssr: false, loading: () => null }),
};
const COUNT_WORD = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
const B = SPACE_RANKS;
const SKY = '#7dd3fc';

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
const freshRun = () => ({ v: 1, phase: 'idle', si: 0, t0: null, results: {} });
const fmtClock = (s) => { const v = Math.max(0, Math.round(Number(s) || 0)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };

// The first (counted) play of a puzzle today, read off the game's own save and
// stats record. Null when it has not been finished today.
function bankedOf(sec) {
  try {
    let save = null;
    try { save = JSON.parse(localStorage.getItem(`sot_${sec.key}_${sec.num}`) || 'null'); } catch (e) { save = null; }
    const st = JSON.parse(localStorage.getItem(`sot_${sec.key}_stats`) || 'null') || {};
    const rec = (st.rec && st.rec[sec.num]) || null;
    const recOk = rec && Number.isFinite(Number(rec.s));
    if (!save || !save.status || save.status === 'playing') {
      return recOk ? { score: Number(rec.s), total: 10, secs: 0, banked: true } : null;
    }
    const secs = save.t0 && save.tEnd ? Math.max(1, Math.round((save.tEnd - save.t0) / 1000)) : 0;
    if (save.status === 'won') return { score: recOk && Number(rec.s) > 0 ? Number(rec.s) : 10, total: 10, secs, banked: true };
    return { score: 0, total: 10, secs, banked: true };
  } catch (e) { return null; }
}

// THE ENTRY CENTREPIECE: mission control, from the mockup. Pressing it is the
// launch.
function Launch({ go, allBanked, onStart }) {
  return (
    <button type="button" className={`sc-mc${go ? ' go' : ''}`} onClick={onStart} aria-label={allBanked ? 'See your rank' : 'Launch'}>
      <svg className="sc-orb" width="96" height="96" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="16" cy="18" r="1.8" /><circle cx="104" cy="26" r="1.5" /><circle cx="100" cy="102" r="1.8" /><circle cx="14" cy="96" r="1.5" />
        <circle cx="60" cy="60" r="44" fill="none" strokeOpacity=".35" />
        <circle cx="60" cy="60" r="25" fill="#fff" strokeWidth="1.5" />
        <path d="M38 55 Q60 48 82 55 M37 66 Q60 73 83 66" fill="none" strokeOpacity=".4" />
        <g className="sc-orbit"><g transform="translate(60,16)"><path d="M0 -8 L7.5 -4 L7.5 4.5 L0 8.5 L-7.5 4.5 L-7.5 -4 Z" fill={SKY} strokeWidth="1.3" /><path d="M-7.5 -4 L0 0 L7.5 -4 M0 0 L0 8.5" fill="none" strokeWidth="1.3" /></g></g>
      </svg>
      <span className="sc-fl">
        <small>Mission control</small>
        <b>{go ? 'Lift off' : allBanked ? 'All four flown today' : 'Cleared for launch'}</b>
        <span>&#9679; Top rank: {B[0][1]}</span>
        <span>{B.length} ranks today, down to {B[B.length - 1][1]}</span>
      </span>
    </button>
  );
}

export default function SpaceCadetClient({ day = null, dateLabel, dateShort, sections = [] }) {
  const N = sections.length;
  const NW = COUNT_WORD[N] || String(N);
  const STORE = `sot_run_${SPACE_RUN_ID}_${etToday()}`;
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
  const board = useCircuitBoard(SPACE_RUN_ID, hydrated && done);

  const counted = useMemo(() => sections.map((sec) => r.results[sec.key] || banked[sec.key] || null), [sections, banked, r.results]);
  const parts = counted.map((c) => (c ? spaceLegPoints(c.score, c.secs) : 0));
  const total = Math.round(parts.reduce((a, b) => a + b, 0));
  const allSolved = N > 0 && counted.every((c) => c && c.score > 0);
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
    const score = res.won === false ? 0 : Number(res.score) || 0;
    commit({ ...cur, results: { ...cur.results, [sec.key]: { score, total: res.total || 10, secs } } });
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

  const tier = spaceTierOf(total, allSolved);
  const rank = B[tier];

  function shareText() {
    const per = sections.map((s, i) => `${s.name} ${counted[i] ? (counted[i].score > 0 ? fmtClock(counted[i].secs) : 'unsolved') : '-'}`).join(' · ');
    const link = `mindloftdaily.com/spacecadet?t=${total}${runClock ? `&c=${runClock}` : ''}${allSolved ? '&f=1' : ''}`;
    return `Space Cadet, ${dateShort}: ${rank[1]}${runClock ? ` in ${fmtClock(runClock)}` : ''}.\n${per}\n${withRef(link)}`;
  }
  function copyShare() {
    const text = done ? shareText() : `Space Cadet: ${NW.toLowerCase()} spatial puzzles on one clock. Roll a die, free a car, untangle the ropes, land a block. Rank from Lost in Space up to Architect-Engineer.\n${withRef('mindloftdaily.com/spacecadet')}`;
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
    const solved = secDone.score > 0;
    const spd = solved && secDone.secs ? Math.max(0, 1 - Math.min(secDone.secs, SPACE_CAP) / SPACE_CAP) : 0;
    return (
      <>
        <b>Leg {r.si + 1} · {sec.name}{earlier ? ', played earlier today' : ''}</b>
        <span>{solved ? 'Solved' : 'Not solved'}{secDone.secs ? ` in ${fmtClock(secDone.secs)}` : ''}</span>
        <span className="sc-bars"><span><em>Speed</em><i><u style={{ width: `${Math.round(100 * spd)}%` }} /></i></span></span>
        <span>A point lost every three seconds; {fmtClock(SPACE_CAP)} or a give-up pays nothing.</span>
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
    return out.length ? { rows: out, field: bd.overallField || bd.uniquePlayers || null, href: '/spacecadet/leaderboard' } : null;
  })();
  // Bottom to top: Lost in Space up to Architect-Engineer.
  const ladder = [...B].reverse().map((t, i) => ({ min: t[0], name: t[1], line: t[5], colour: rampFor(i), chip: t[3] }));
  const up = allSolved && tier > 0 ? B[tier - 1] : null;
  const upGap = up ? Math.max(1, Math.ceil((runClock - up[6]))) : 0;

  return (
    <>
      {!hydrated ? <GauntletCover sections={gs} /> : null}
      <div className="sc" data-sot-wait="">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />

        {hydrated && r.phase === 'idle' && (
          <div className="sc-gate">
            <GauntletGate
              circuitName="Space Cadet"
              ground={SKY}
              banner={<RunOtherDeviceBar runId={SPACE_RUN_ID} keys={sections.map((s) => s.key)} show={hydrated && r.phase === 'idle' && !r.t0 && !allBanked} />}
              dateLabel={dateShort}
              sections={gs}
              lineFor={(s) => s.chip || ''}
              bandNote={(s) => (
                <span className="sc-bq">{banked[s.key] ? (banked[s.key].score > 0 ? `Done${banked[s.key].secs ? ` ${fmtClock(banked[s.key].secs)}` : ''}` : 'Played') : `Leg ${s.slot + 1}`}</span>
              )}
              headline={<>{NW} Legs.<br />One Launch.</>}
              rule="One clock across all four puzzles. Your time decides your rank."
              lineup={`From ${B[B.length - 1][1]} up to ${B[0][1]}.`}
              startLabel={leaving ? 'Lifting off…' : (allBanked ? 'See your rank' : 'Launch')}
              fieldLine={Object.keys(banked).length ? 'Played one today already? Your first result stands.' : null}
              centerpiece={<Launch go={leaving} allBanked={allBanked} onStart={start} />}
              onStart={start}
            />
          </div>
        )}

        {hydrated && playing && sec && (
          <RunPlayFrame sections={gs} idx={r.si} pastel={sec.color} title="Space Cadet" sub={`Leg ${r.si + 1} of ${N} · ${sec.name}`}
            foot={<>
              Run total {Math.round(runSoFar + (secDone ? parts[r.si] : 0))} of {SPACE_MAX}
              {mounted && !between ? <> · <button type="button" className="sc-lk" onClick={() => setHelpSeq((x) => x + 1)}>How to play {sec.name}</button></> : null}
              {between && peek ? <> · <button type="button" className="sc-lk" onClick={() => setPeek(false)}>Back to the results</button></> : null}
            </>}>
            {mounted ? (
              <div className="sc-host">
                <RunEmbed onResult={onSectionDone} theme={boardTheme} help={helpSeq} autostart>
                  <Game key={`${sec.key}-${sec.num}`} puzzles={[sec.puzzle]} forceNum={null} />
                </RunEmbed>
              </div>
            ) : null}
          </RunPlayFrame>
        )}

        {hydrated && playing && sec && between && !peek && (
          <div className={last ? 'sc-final' : ''}>
            <GauntletBetween
              circuitName="Space Cadet"
              sections={gs}
              results={[]}
              doneCount={r.si + 1}
              lastSec={gs[r.si]}
              upNext={nextSec || rankSec}
              upIdx={nextSec ? r.si + 1 : -1}
              stepWord="Leg"
              nextLine={nextSec ? `${nextSec.chip} · up to ${SPACE_LEG_MAX} points` : 'Where does your time rank you?'}
              lastBody={doneBody()}
              lastFig={{ v: Math.round(parts[r.si]), unit: `of ${SPACE_LEG_MAX}` }}
              auto={false}
              goLabel={nextSec ? `Next: ${nextSec.name}` : 'See My Rank'}
              fine={<>The clock waits: each puzzle&rsquo;s clock starts when it opens.{mounted ? <><br /><button type="button" className="sc-lk" onClick={() => setPeek(true)}>See your finished board</button></> : null}</>}
              onGo={advance}
              leaveHref="/circuits/spacecadet"
            />
          </div>
        )}

        <RunChallengeCapture gameKey={SPACE_RUN_ID} />
        {hydrated && done && (
          <GauntletEndStage
            runId={SPACE_RUN_ID}
            circuitName="Space Cadet"
            dateLabel={dateShort}
            sections={gs}
            results={sections.map((s, i) => ({ key: s.key, score: counted[i] ? Math.round(parts[i]) : '–' }))}
            score={total}
            unitWord="points"
            colLabel="Leg"
            ladder={ladder}
            ladderHeading="Where does your time rank you?"
            title={{ name: rank[1], line: rank[5], colour: rampFor(B.length - 1 - tier) }}
            topNote={`${runClock > 0 ? `${fmtClock(runClock)} across all four` : 'Time on file'}${!allSolved ? ' · a leg left unsolved' : up ? ` · ${fmtClock(upGap)} from ${up[1]}` : tier === 0 ? ' · top rank' : ''}`}
            rank={meB && Number.isFinite(Number(meB.rank)) ? Number(meB.rank) : null}
            fieldSize={bd ? (bd.overallField || bd.uniquePlayers || overall.length || null) : null}
            board={boardOut}
            rowsIn={rows}
            leaderScore={overall[0] ? Math.round(Number(overall[0].total)) : null}
            extra={<RunChallengeLine gameKey={SPACE_RUN_ID} score={total} total={SPACE_MAX} n={runToken()} style={{ margin: 0 }} />}
            challenge={<RunChallengeButton gameKey={SPACE_RUN_ID} score={total} total={SPACE_MAX} n={runToken()} t={runClock > 0 ? Math.round(runClock) : null} status={rank[1]} door />}
            meme={<RunMeme gameKey={SPACE_RUN_ID} score={total} total={SPACE_MAX} n={runToken()} status={rank[1]} cat="Visual" />}
            more={<MoreRunsList self={SPACE_RUN_ID} ink="var(--gsx-ink)" mute="var(--gsx-ink)" line="color-mix(in srgb, var(--gsx-ink) 30%, transparent)" style={{ margin: 0 }} />}
            onShare={copyShare}
            copied={copied}
            sweep={doneAtLoad.current === false}
            finale={doneAtLoad.current === false ? { key: SPACE_RUN_ID, legWord: 'Leg', legMax: sections.map(() => SPACE_LEG_MAX) } : null}
          />
        )}
        <MoreRunsPop self={SPACE_RUN_ID} ready={settled && doneAtLoad.current === false} delay={2500} fireOnLeave />
      </div>
    </>
  );
}

const CSS = `
.sc{min-height:100vh;font-family:'Manrope',system-ui,sans-serif}
.sc *{box-sizing:border-box}
/* The embedded puzzle sits on the leg's band colour, not its own sheet; the
   board inside keeps its own colours and play (owner: keep Roll and Topple). */
.sc-host .stage-page{min-height:0 !important;background:transparent !important;overflow-x:visible !important}
.gsx-play[data-stage-theme='light'] .sc-host .stage-page{--stg-mute:#33495a !important;--stg-mute2:#33495a !important;--stg-dim:#3d5263 !important;--stg-ink:#08222e !important}
.sc-host .pk-wrap{padding-top:6px !important}
.sc-lk{background:none;border:0;padding:4px 2px;color:inherit;font:inherit;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.sc-bq{font-weight:800}
.sc-bars{display:flex;flex-direction:column;gap:5px;margin:4px 0 2px}
.sc-bars > span{display:flex;align-items:center;gap:8px}
.sc-bars em{width:46px;flex:none;font-style:normal;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.sc-bars i{flex:1;height:8px;border:1.5px solid var(--gsx-ink);border-radius:999px;overflow:hidden}
.sc-bars u{display:block;height:100%;background:var(--gsx-ink);text-decoration:none;transform-origin:left;animation:scfill .7s ease .6s both}
@keyframes scfill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.sc-final .gsx-eye2{font-size:0 !important}
.sc-final .gsx-eye2::after{content:'Up Next \\00B7  Your Rank';font-size:15px}
/* ENTRY CENTREPIECE: mission control, on paper in the stage ink. */
.sc-mc{display:flex;align-items:center;gap:16px;width:100%;margin:0;padding:14px 16px;border:1px solid var(--gsx-ink);border-radius:16px;background:#ffffff;color:#08222e;box-shadow:4px 4px 0 var(--gsx-ink);cursor:pointer;font:inherit;text-align:left}
.sc-mc:focus-visible{outline:3px solid var(--gsx-ink);outline-offset:3px}
.sc-orb{flex:none;stroke:#08222e;fill:#08222e}
.sc-orb circle[fill='#fff']{fill:#ffffff}
.sc-orbit{transform-origin:60px 60px;animation:scorb 9s linear infinite}
.sc-mc.go .sc-orbit{animation-duration:.9s}
@keyframes scorb{to{transform:rotate(360deg)}}
.sc-fl{display:flex;flex-direction:column;gap:2px;min-width:0}
.sc-fl small{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.75}
.sc-fl b{font-size:20px;font-weight:800;letter-spacing:-.01em}
.sc-fl span{font-size:13px;font-weight:700}
.sc-mc:hover{background:#f0f9ff}
@media(min-width:900px){
  .sc-gate .gsx-split{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto auto auto;row-gap:18px}
  .sc-gate .gsx-split > .gsx-top{margin-bottom:0}
  .sc-gate .gsx-head{grid-row:2 / span 2}
  .sc-gate .gsx-piece{display:flex}
}
@media(prefers-reduced-motion:reduce){.sc *{animation:none !important;transition:none !important}}
`;
