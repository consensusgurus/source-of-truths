'use client';

// DUE DILIGENCE: a stock chart, an IPO filing and a resume as one run (owner,
// 2026-11-10).
//
// Tape, Filing, then Resume (lib/due-diligence.js), back to back on one page,
// then a rank from Anon Fintwit Account up to Ken Griffin. "Due Diligence" is
// the run's name, never a rung. Inside the run the legs are labelled The stock,
// The company and The background check; each game keeps its own name on its
// own page (owner, same day). Clues decide: each solved leg pays what its own
// page pays, 11 minus the clues opened, so the run is out of 30.
//
// EACH PUZZLE IS THE REAL GAME, mounted inside app/RunEmbed.jsx (SimpleDaily
// reports through useRunEmbed), exactly as it plays on its own page. The save
// and the /api/quiz/result row are that game's own, so the run leaves exactly
// what three separate plays would, and the circuit board (scorer
// 'duediligence') adds those rows up with the same points used here. A puzzle
// already finished today on its own page is not replayed: its first result
// stands.
//
// Forked from app/spacecadet/SpaceCadetClient.jsx.

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
import { DD_RUN_ID, DD_RANKS, DD_MAX, DD_LEG_MAX, ddTierOf, ddLegPoints } from '@/lib/due-diligence';

const CLIENTS = {
  tape: dynamic(() => import('../tape/TapeClient'), { ssr: false, loading: () => null }),
  filing: dynamic(() => import('../filing/FilingClient'), { ssr: false, loading: () => null }),
  resume: dynamic(() => import('../resume/ResumeClient'), { ssr: false, loading: () => null }),
};
const COUNT_WORD = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
const B = DD_RANKS;
const GROUND = '#a5b4fc';
const MAXC = 6;   // six clues on every leg

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
const freshRun = () => ({ v: 1, phase: 'idle', si: 0, t0: null, results: {} });

// The first (counted) play of a puzzle today, read off the game's own save
// (SimpleDaily: { status, t0, tEnd, s: { open } }) and stats record. Null when
// it has not been finished today. Points are the page's own: 11 minus the
// clues opened when solved, else 0. A result filed on another device leaves
// only a won/lost record here, so a win there counts as the mid-ladder 7 on
// this screen; the board reads the real row.
function bankedOf(sec) {
  try {
    let save = null;
    try { save = JSON.parse(localStorage.getItem(`sot_${sec.key}_${sec.num}`) || 'null'); } catch (e) { save = null; }
    const st = JSON.parse(localStorage.getItem(`sot_${sec.key}_stats`) || 'null') || {};
    const rec = (st.rec && st.rec[sec.num]) || null;
    if (!save || !save.status || save.status === 'playing') {
      return rec ? { score: rec.won ? 7 : 0, total: 10, clues: null, banked: true } : null;
    }
    const open = save.s && Number.isFinite(Number(save.s.open)) ? Math.min(MAXC, Math.max(1, Number(save.s.open))) : MAXC;
    if (save.status === 'won') return { score: 11 - open, total: 10, clues: open, banked: true };
    return { score: 0, total: 10, clues: open, banked: true };
  } catch (e) { return null; }
}

// THE ENTRY CENTREPIECE: the deal memo, which asks who you are (owner,
// 2026-11-10: not the lineup again, which the bands below already show; the
// ranking low to high instead, and Jim Cramer named). Pressing it starts the
// run. It sits in GauntletGate's fixed-height piece slot (140px, 170px wide).
const SURNAME = (n) => (n === 'Anon Fintwit Account' ? 'Anon' : String(n).split(' ').pop());
function Memo({ go, allBanked, onStart }) {
  const up = [...B].reverse();
  return (
    <button type="button" className={`dd-memo${go ? ' go' : ''}`} onClick={onStart} aria-label={allBanked ? 'See your rank' : 'Open the file'}>
      <span className="dd-mh"><small>Confidential</small><small>Deal memo</small></span>
      <b>{go ? 'Opening the file' : allBanked ? 'All three checked. So, who are you?' : <>Are you a Jim Cramer or a {B[0][1]}?</>}</b>
      <span className="dd-ml" aria-label={`Ranks, low to high: ${up.map((t) => t[1]).join(', ')}`}>
        <em>Low</em>
        {up.map((t, k) => <span key={t[1]} className={k === up.length - 1 ? 'top' : ''} style={{ '--c': t[4] }}>{SURNAME(t[1])}</span>)}
        <em>High</em>
      </span>
    </button>
  );
}

export default function DueDiligenceClient({ day = null, dateLabel, dateShort, sections = [] }) {
  const N = sections.length;
  const NW = COUNT_WORD[N] || String(N);
  const STORE = `sot_run_${DD_RUN_ID}_${etToday()}`;
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
  const board = useCircuitBoard(DD_RUN_ID, hydrated && done);

  const counted = useMemo(() => sections.map((sec) => r.results[sec.key] || banked[sec.key] || null), [sections, banked, r.results]);
  const parts = counted.map((c) => (c ? ddLegPoints(c.score) : 0));
  const total = Math.round(parts.reduce((a, b) => a + b, 0));
  const allSolved = N > 0 && counted.every((c) => c && c.score > 0);
  const allBanked = N > 0 && sections.every((s) => banked[s.key]);
  const clues = counted.reduce((a, c) => a + ((c && c.clues) || 0), 0);

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
    // the page's score is 11 - clues, so the clues come back out of it
    const cl = score > 0 ? 11 - score : MAXC;
    commit({ ...cur, results: { ...cur.results, [sec.key]: { score, total: res.total || 10, clues: cl } } });
    setHolding(sec.key);
    // Owner, 2026-11-10: "need a longer pause after getting it right or wrong
    // ... no time to read the answer". The revealed board now holds a good
    // while, and the handover card repeats the answer.
    setTimeout(() => setHolding((h) => (h === sec.key ? null : h)), Math.max(4500, (res.beatMs || 0) + 3000));
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

  const tier = ddTierOf(total);
  const rank = B[tier];

  const clueWord = (c) => (c && c.score > 0 ? (c.clues ? `${c.clues} clue${c.clues === 1 ? '' : 's'}` : 'named') : 'missed');
  function shareText() {
    const per = sections.map((s, i) => `${s.form} ${counted[i] ? clueWord(counted[i]) : '-'}`).join(' · ');
    const link = `mindloftdaily.com/duediligence?t=${total}`;
    return `Due Diligence, ${dateShort}: ${rank[1]}, ${total}/${DD_MAX}.\n${per}\n${withRef(link)}`;
  }
  function copyShare() {
    const text = done ? shareText() : `Are you a Jim Cramer or a Ken Griffin? Due Diligence: name a stock from its chart, a company from its IPO filing and a person from their resume. Fewer clues rank higher: Anon Fintwit Account, Jim Cramer, Michael Burry, Stanley Druckenmiller, Ken Griffin.\n${withRef('mindloftdaily.com/duediligence')}`;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  // Inside the run each leg wears its label (The stock, ...), not the game's name.
  const gs = useMemo(() => sections.map((s, i) => ({ ...s, name: s.form || s.name, game: s.name, slot: i, questions: [] })), [sections]);
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
    const pz = sec.puzzle || {};
    const ans = pz.name ? `${pz.name}${pz.ticker ? ` (${pz.ticker})` : ''}` : null;
    return (
      <>
        <b>Leg {r.si + 1} · {sec.form}{earlier ? ', played earlier today' : ''}</b>
        <span>{sec.name}: {solved ? (secDone.clues ? `named in ${secDone.clues} clue${secDone.clues === 1 ? '' : 's'}` : 'named') : 'not named'}</span>
        {ans ? <span>The answer: {ans}</span> : null}
        <span className="dd-pips" aria-hidden="true">{Array.from({ length: MAXC }, (_, k) => <i key={k} className={solved && secDone.clues && k < secDone.clues ? 'on' : ''} />)}</span>
        <span>The first clue pays {DD_LEG_MAX}, each extra one a point less; a miss pays nothing.</span>
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
    return out.length ? { rows: out, field: bd.overallField || bd.uniquePlayers || null, href: '/duediligence/leaderboard' } : null;
  })();
  // Bottom to top: Lost in Space up to Architect-Engineer.
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
              circuitName="Due Diligence"
              ground={GROUND}
              banner={<RunOtherDeviceBar runId={DD_RUN_ID} keys={sections.map((s) => s.key)} show={hydrated && r.phase === 'idle' && !r.t0 && !allBanked} />}
              dateLabel={dateShort}
              sections={gs}
              lineFor={(s) => `${s.game}: ${s.chip || ''}`}
              bandNote={(s) => (
                <span className="dd-bq">{banked[s.key] ? (banked[s.key].score > 0 ? `Done, ${banked[s.key].score} pts` : 'Played') : `Leg ${s.slot + 1}`}</span>
              )}
              headline={<>{NW} Checks.<br />One Deal.</>}
              rule="Name the stock, the company and the person. Fewer clues score more."
              lineup={`From ${B[B.length - 1][1]} up to ${B[0][1]}.`}
              startLabel={leaving ? 'Opening the file…' : (allBanked ? 'See your rank' : 'Open the file')}
              fieldLine={Object.keys(banked).length ? 'Played one today already? Your first result stands.' : null}
              centerpiece={<Memo go={leaving} allBanked={allBanked} onStart={start} />}
              onStart={start}
            />
          </div>
        )}

        {hydrated && playing && sec && (
          <RunPlayFrame sections={gs} idx={r.si} pastel={sec.color} title="Due Diligence" sub={`Leg ${r.si + 1} of ${N} · ${sec.form}`}
            foot={<>
              Run total {Math.round(runSoFar + (secDone ? parts[r.si] : 0))} of {DD_MAX}
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
              circuitName="Due Diligence"
              sections={gs}
              results={[]}
              doneCount={r.si + 1}
              lastSec={gs[r.si]}
              upNext={nextSec || rankSec}
              upIdx={nextSec ? r.si + 1 : -1}
              stepWord="Leg"
              nextLine={nextSec ? `${nextSec.game}: ${nextSec.chip} · up to ${DD_LEG_MAX} points` : 'Where does your homework rank you?'}
              lastBody={doneBody()}
              lastFig={{ v: Math.round(parts[r.si]), unit: `of ${DD_LEG_MAX}` }}
              auto={false}
              goLabel={nextSec ? `Next: ${nextSec.name}` : 'See My Rank'}
              fine={<>Clues decide, not the clock.{mounted ? <><br /><button type="button" className="dd-lk" onClick={() => setPeek(true)}>See your finished board</button></> : null}</>}
              onGo={advance}
              leaveHref="/circuits/duediligence"
            />
          </div>
        )}

        <RunChallengeCapture gameKey={DD_RUN_ID} />
        {hydrated && done && (
          <GauntletEndStage
            runId={DD_RUN_ID}
            circuitName="Due Diligence"
            dateLabel={dateShort}
            sections={gs}
            results={sections.map((s, i) => ({ key: s.key, score: counted[i] ? Math.round(parts[i]) : '–' }))}
            score={total}
            unitWord="points"
            colLabel="Leg"
            ladder={ladder}
            ladderHeading="Where does your homework rank you?"
            title={{ name: rank[1], line: rank[5], colour: rampFor(B.length - 1 - tier) }}
            topNote={`${clues > 0 ? `${clues} clue${clues === 1 ? '' : 's'} across all three` : 'Clues on file'}${!allSolved ? ' · a leg not named' : ''}${up ? ` · ${upGap} point${upGap === 1 ? '' : 's'} from ${up[1]}` : tier === 0 ? ' · top rank' : ''}`}
            rank={meB && Number.isFinite(Number(meB.rank)) ? Number(meB.rank) : null}
            fieldSize={bd ? (bd.overallField || bd.uniquePlayers || overall.length || null) : null}
            board={boardOut}
            rowsIn={rows}
            leaderScore={overall[0] ? Math.round(Number(overall[0].total)) : null}
            extra={<RunChallengeLine gameKey={DD_RUN_ID} score={total} total={DD_MAX} n={runToken()} style={{ margin: 0 }} />}
            challenge={<RunChallengeButton gameKey={DD_RUN_ID} score={total} total={DD_MAX} n={runToken()} status={rank[1]} door />}
            meme={<RunMeme gameKey={DD_RUN_ID} score={total} total={DD_MAX} n={runToken()} status={rank[1]} cat="Trivia" />}
            more={<MoreRunsList self={DD_RUN_ID} ink="var(--gsx-ink)" mute="var(--gsx-ink)" line="color-mix(in srgb, var(--gsx-ink) 30%, transparent)" style={{ margin: 0 }} />}
            onShare={copyShare}
            copied={copied}
            sweep={doneAtLoad.current === false}
            finale={doneAtLoad.current === false ? { key: DD_RUN_ID, legWord: 'Leg', legMax: sections.map(() => DD_LEG_MAX) } : null}
          />
        )}
        <MoreRunsPop self={DD_RUN_ID} ready={settled && doneAtLoad.current === false} delay={2500} fireOnLeave />
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
.dd-pips{display:flex;gap:5px;margin:4px 0 2px}
.dd-pips i{width:22px;height:8px;border:1.5px solid var(--gsx-ink);border-radius:999px}
.dd-pips i.on{background:var(--gsx-ink)}
.dd-final .gsx-eye2{font-size:0 !important}
.dd-final .gsx-eye2::after{content:'Up Next \\00B7  Your Rank';font-size:15px}
/* ENTRY CENTREPIECE: the deal memo, on paper in the stage ink. */
.dd-memo{display:flex;flex-direction:column;justify-content:center;gap:7px;width:100%;height:100%;margin:0;padding:10px 16px;overflow:hidden;border:1px solid var(--gsx-ink);border-radius:16px;background:#ffffff;color:#08222e;box-shadow:4px 4px 0 var(--gsx-ink);cursor:pointer;font:inherit;text-align:left;transition:transform .2s ease}
.dd-memo:focus-visible{outline:3px solid var(--gsx-ink);outline-offset:3px}
.dd-memo:hover{background:#eef2ff}
.dd-memo.go{transform:translateY(-3px)}
.dd-mh{display:flex;justify-content:space-between;border-bottom:2px solid #08222e;padding-bottom:6px}
.dd-mh small{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.dd-mh small:first-child{color:#b91c1c}
.dd-memo b{font-size:19px;line-height:1.15;font-weight:800;letter-spacing:-.01em}
.dd-ml{display:flex;flex-wrap:wrap;align-items:center;gap:5px}
.dd-ml > span{display:inline-flex;align-items:center;padding:3px 9px;border:1.5px solid #08222e;border-radius:999px;background:var(--c);font-size:12.5px;font-weight:800;white-space:nowrap}
.dd-ml > span.top{background:#08222e;color:#ffffff}
.dd-ml em{font-style:normal;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.7}
@media(max-width:480px){.dd-memo{gap:6px}.dd-memo b{font-size:16px}.dd-ml{gap:4px}.dd-ml > span{padding:2px 7px;font-size:11.5px}}
@media(min-width:900px){
  .dd-gate .gsx-split{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto auto auto;row-gap:18px}
  .dd-gate .gsx-split > .gsx-top{margin-bottom:0}
  .dd-gate .gsx-head{grid-row:2 / span 2}
  .dd-gate .gsx-piece{display:flex}
}
@media(prefers-reduced-motion:reduce){.dd *{animation:none !important;transition:none !important}}
`;
