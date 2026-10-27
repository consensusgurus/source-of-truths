'use client';

// CROSSED UP: five crosswords as one run (owner, 2026-10-20; Anon joined as the
// final puzzle 2026-10-24).
//
// Emcee, Encore, Arcos, Glyph, then Anon (lib/crossed.js), back to back on one
// page, then a rank: the run total decides which day's newspaper crossword you
// are ready for, Monday up to Saturday, and at the top "Solves in Pen". Speed
// is most of the score.
//
// EACH PUZZLE IS THE REAL GAME, mounted inside app/RunEmbed.jsx. The start
// gate, the save, the hint and the /api/quiz/result row are exactly what that
// game does on its own page, so the run leaves exactly what five separate
// plays would, and the circuit board (scorer 'crossed') adds those rows up
// with the same scorer used here. A puzzle already finished today on its own
// page is not replayed: its first result stands.
//
// ON THE STAGE (owner, 2026-10-26: "our new run aesthetic, taking elements of
// old too"). The run's four screens wear the run stage (app/GauntletScreens.jsx)
// like Judged, Passport and Price Check, at phone and desktop size, and keep
// the crossword pieces the old page was built from:
//   - ENTRY: the stage gate; its picture is the old 1 Across button (CROSSED
//     UP typing itself into the squares, inked in pen on the tap), and each
//     lineup band carries that puzzle's grid shape, the old puzzle-page clipping.
//   - PLAY: each grid in RunPlayFrame on its pastel step, the board following
//     the stage's look (the stage look button replaces the old board switch).
//   - BETWEEN: the stage handover, with the grid just finished shown inked.
//   - ENDING: the old curtain (each grid ripples in on its own colour while its
//     clock and points land) in stage colours, then the stage ending, which
//     climbs THE WEEK, Monday to In Pen, and lands the old Week strip with the
//     red pen circle and the Inked seal.

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
import { CROSSED_RUN_ID, CROSSED_BELTS, CROSSED_CLOCK, CROSSED_MAX, crossedTierOf, crossedGridPoints, crossedAcc, crossedSpeed } from '@/lib/crossed';
import CrossedCurtain, { gridOf } from './CrossedCurtain';
import Week, { WEEK_CSS } from './Week';

const CLIENTS = {
  emcee: dynamic(() => import('../emcee/EmceeClient'), { ssr: false, loading: () => null }),
  encore: dynamic(() => import('../encore/EncoreClient'), { ssr: false, loading: () => null }),
  arcos: dynamic(() => import('../arcos/ArcosClient'), { ssr: false, loading: () => null }),
  glyph: dynamic(() => import('../glyph/GlyphClient'), { ssr: false, loading: () => null }),
  anon: dynamic(() => import('../anon/AnonClient'), { ssr: false, loading: () => null }),
};
const COUNT_WORD = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
const B = CROSSED_BELTS;

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
    const rev = sec.puzzle && sec.puzzle.rev ? sec.puzzle.rev : '';
    let save = null;
    for (const k of [`sot_${sec.key}_${sec.num}${rev}`, `sot_${sec.key}_${sec.num}`]) {
      try { save = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { save = null; }
      if (save) break;
    }
    const st = JSON.parse(localStorage.getItem(`sot_${sec.key}_stats`) || 'null') || {};
    const rec = (st.rec && st.rec[sec.num]) || null;
    const recOk = rec && Number.isFinite(Number(rec.s)) && Number(rec.t) > 0;
    if (!save || !save.status || save.status === 'playing') {
      return recOk ? { score: Number(rec.s), total: Number(rec.t), secs: 0, banked: true } : null;
    }
    const secs = save.t0 && save.tEnd ? Math.round((save.tEnd - save.t0) / 1000) : 0;
    if (save.status === 'revealed' || save.status === 'gaveup') return { score: recOk ? Number(rec.s) : 0, total: recOk ? Number(rec.t) : 10, secs, banked: true };
    if (recOk && !(save.status === 'won' && Number(rec.s) === 0)) return { score: Number(rec.s), total: Number(rec.t), secs, banked: true };
    if (save.status === 'won') return { score: 10, total: 10, secs, banked: true };
    return { score: 0, total: 0, secs: 0, banked: true, unknown: true };
  } catch (e) { return null; }
}

// A puzzle's grid, small: black squares and paper ones. With no result (or an
// unsolved one) it is the shape alone and spoils nothing; a solved grid shows
// its letters (CrossedCurtain's gridOf decides which).
function MiniGrid({ sec, res = null, className = 'cr-g', px = 0 }) {
  const { w, h, cells } = useMemo(() => gridOf(sec, res), [sec, res]);
  const n = Math.max(w, h);
  return (
    <span className={className} aria-hidden="true" style={{ gridTemplateColumns: `repeat(${w}, minmax(0,1fr))`, gridTemplateRows: `repeat(${h}, minmax(0,1fr))`, aspectRatio: `${w} / ${h}`, '--fs': `${Math.max(5, Math.round((px || 40) / n * 0.6))}px` }}>
      {cells.flat().map((v, i) => <i key={i} className={v === '#' ? 'b' : ''}>{v !== '#' && v !== ' ' ? v : null}</i>)}
    </span>
  );
}

// THE START BUTTON is an across entry: 1 Across, (7, 2), and CROSSED UP types
// itself into the squares in pencil. Pressing it inks the letters in pen.
const ENTRY = 'CROSSED#UP';
function AcrossEntry({ go, allBanked, n, onStart }) {
  return (
    <button type="button" className={`cr-xw${go ? ' go' : ''}`} onClick={onStart} aria-label={allBanked ? 'See your rank' : 'Pick up the pencil'}>
      <span className="cr-xwc"><b>1 Across</b> {allBanked ? `All ${String(COUNT_WORD[n] || n).toLowerCase()} filled in today` : `${COUNT_WORD[n] || n} grids in one sitting`} <em>(7, 2)</em></span>
      <span className="cr-xwr">
        {ENTRY.split('').map((ch, i) => (ch === '#'
          ? <i key={i} className="cr-xc blk" />
          : <i key={i} className="cr-xc" style={{ '--d': `${0.45 + i * 0.08}s` }}>{i === 0 ? <small>1</small> : null}<b>{ch}</b></i>))}
      </span>
    </button>
  );
}

export default function CrossedClient({ day = null, dateLabel, dateShort, sections = [], clocks: clocksIn = null }) {
  // The day's clocks come from the server (lib/crossed-clocks.js); the seed covers a
  // page served before they could be measured.
  const CLK = clocksIn || CROSSED_CLOCK;
  const N = sections.length;
  const NW = COUNT_WORD[N] || String(N);
  const STORE = `sot_run_crossed_${etToday()}`;
  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [leaving, setLeaving] = useState(false);
  const [holding, setHolding] = useState(null);
  const [peek, setPeek] = useState(false);
  // How to play, from the run: the embedded grid has no cap of its own.
  const [helpSeq, setHelpSeq] = useState(0);
  const [copied, setCopied] = useState(false);
  const doneAtLoad = useRef(null);
  const [settled, setSettled] = useState(false);
  const [curtainDone, setCurtainDone] = useState(false);
  // The embedded grids follow the stage's look: dark ink on the pastel unless
  // the reader picked one of the black looks (the stage's look button is the
  // one switch; the old board-only switch is gone).
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
  const board = useCircuitBoard(CROSSED_RUN_ID, hydrated && done);

  const counted = useMemo(() => sections.map((sec) => r.results[sec.key] || banked[sec.key] || null), [sections, banked, r.results]);
  const parts = counted.map((c, i) => (c ? crossedGridPoints(sections[i].key, c.score, c.total, c.secs, CLK, day) : 0));
  const total = Math.round(parts.reduce((a, b) => a + b, 0));
  const allBanked = N > 0 && sections.every((s) => banked[s.key]);

  // The pencil inks the entry (the old button's own beat), then the first grid.
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

  // A grid reports its filed result. The finished board holds for its finish
  // beat (RunEmbed plays it) and a moment more, then the handover covers it.
  const onSectionDone = useCallback((res) => {
    const cur = rRef.current;
    const sec = sections[cur.si];
    if (!sec || !res || res.key !== sec.key || cur.results[sec.key]) return;
    const secs = res.t0 ? Math.max(1, Math.round(((res.tEnd || Date.now()) - res.t0) / 1000)) : 0;
    commit({ ...cur, results: { ...cur.results, [sec.key]: { score: res.score, total: res.total, secs } } });
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
  // THE LAST GRID ROLLS STRAIGHT INTO THE GRADING on its own (the button is
  // there for anyone faster), unless the reader is looking back at the board.
  useEffect(() => {
    if (!between || !last || peek) return undefined;
    const t = setTimeout(() => advance(), 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [between, last, peek]);

  const tier = crossedTierOf(total);
  const belt = B[tier];

  function shareText() {
    const per = sections.map((s, i) => `${s.name} ${counted[i] ? Math.round(parts[i]) : '-'}`).join(' · ');
    const code = sections.length >= 4 && sections.length <= 5 ? sections.map((s, i) => Math.round(parts[i])).join('-') : '';
    const link = `mindloftdaily.com/crossed${code ? `?s=${code}&t=${total}&d=${etToday()}` : ''}`;
    return `Crossed Up · ${dateShort} · ${total}/${CROSSED_MAX}\n${belt[1]}.${tier > 0 ? `\nNext up: ${B[tier - 1][1]}, ${Math.max(1, B[tier - 1][0] - total)} short.` : ''}\n${per}\n${withRef(link)}`;
  }
  function copyShare() {
    const text = done ? shareText() : `Crossed Up: ${NW.toLowerCase()} crosswords in one sitting, and speed is most of the score. Rank from Monday solver up to Solves in Pen.\n${withRef('mindloftdaily.com/crossed')}`;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  // The stage's sections: one ladder step per puzzle, in play order.
  const gs = useMemo(() => sections.map((s, i) => ({ ...s, slot: i, questions: [] })), [sections]);
  const runSoFar = sections.slice(0, r.si).reduce((a, s, i) => a + (counted[i] ? parts[i] : 0), 0);
  const Game = sec ? CLIENTS[sec.key] : null;
  const mounted = !!(Game && sec && !banked[sec.key]);

  // The curtain plays once, on the finish itself: never for reduced motion or a
  // run restored already finished. Tap or any key skips it.
  const reduce = useMemo(() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }, []);
  const curtainOn = hydrated && done && doneAtLoad.current === false && !reduce && !curtainDone;
  useEffect(() => {
    if (!hydrated || !done || curtainOn) return undefined;
    const t = setTimeout(() => setSettled(true), doneAtLoad.current === false ? 6500 : 0);
    return () => clearTimeout(t);
  }, [hydrated, done, curtainOn]);

  // The grid just finished, for the handover card.
  function doneBody() {
    if (!sec || !secDone) return null;
    const earlier = banked[sec.key] && !r.results[sec.key];
    const acc = crossedAcc(secDone.score, secDone.total);
    const spd = crossedSpeed(sec.key, secDone.secs, CLK);
    return (
      <>
        <b>Puzzle {r.si + 1} · {sec.name}{earlier ? ', solved earlier today' : ''}</b>
        {secDone.unknown ? <span>Result on file. Your first time stands.</span> : (
          <>
            <span>{acc >= 1 ? 'Solved clean' : acc > 0 ? `${Math.round(100 * acc)}% filled` : 'Unfinished'}{secDone.secs ? ` in ${fmtClock(secDone.secs)}` : ''}</span>
            <span className="cr-bars">
              <span><em>Solve</em><i><u style={{ width: `${Math.round(100 * acc)}%` }} /></i></span>
              <span><em>Speed</em><i><u style={{ width: `${Math.round(100 * spd)}%` }} /></i></span>
            </span>
            <span>Full speed marks under {fmtClock((CLK[sec.key] || CROSSED_CLOCK[sec.key])[0])}</span>
          </>
        )}
      </>
    );
  }

  const nextSec = playing && !last ? gs[r.si + 1] : null;
  const weekSec = { key: '__week', name: 'The Week', slot: N, questions: [] };

  // The end screen's figures off today's board.
  const bd = board && board.data;
  const sf = bd && bd.stageField;
  const avg = stageAvg(sf, sections);
  const rows = sections.map((s, i) => {
    const g = sf && sf.games && sf.games[s.key];
    const a = avg && avg[s.key] != null ? Number(avg[s.key]) : null;
    return {
      key: s.key, name: s.name, bg: rampFor(i),
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
    return out.length ? { rows: out, field: bd.overallField || bd.uniquePlayers || null, href: '/crossed/leaderboard' } : null;
  })();
  // THE WEEK, bottom to top: Monday up to In Pen, each rung its ladder step,
  // with the rank's own newspaper colour as its chip.
  const ladder = [...B].reverse().map((t, i) => ({ min: t[0], name: t[1], line: t[5], colour: rampFor(i), chip: t[3] }));
  const runClock = counted.reduce((a, c) => a + ((c && c.secs) || 0), 0);
  const up = tier > 0 ? B[tier - 1] : null;

  return (
    <>
      {!hydrated ? <GauntletCover sections={gs} /> : null}
      <div className="cr" data-sot-wait="">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />

        {hydrated && r.phase === 'idle' && (
          <div className="cr-gate">
            <GauntletGate
              circuitName="Crossed Up"
              banner={<RunOtherDeviceBar runId={CROSSED_RUN_ID} keys={sections.map((s) => s.key)} show={hydrated && r.phase === 'idle' && !r.t0 && !allBanked} />}
              dateLabel={dateShort}
              sections={gs}
              lineFor={(s) => s.form && s.form !== s.name ? s.form : (s.chip || '')}
              bandNote={(s) => (
                <span className="cr-bq">
                  <span>{banked[s.key] ? (banked[s.key].unknown ? 'Done' : `Done${banked[s.key].secs ? ` ${fmtClock(banked[s.key].secs)}` : ''}`) : `${s.weight} pts`}</span>
                  <MiniGrid sec={s} />
                </span>
              )}
              headline={<>{NW} Grids.<br />One Week.</>}
              rule="Finishing counts a fifth, speed counts the rest."
              lineup="Your score says which day of the week you solve like."
              startLabel={leaving ? 'Inking it in…' : (allBanked ? 'See your rank' : 'Pick up the pencil')}
              fieldLine={Object.keys(banked).length ? 'Solved one today already? Your first time stands.' : null}
              centerpiece={<AcrossEntry go={leaving} allBanked={allBanked} n={N} onStart={start} />}
              onStart={start}
            />
          </div>
        )}

        {hydrated && playing && sec && (
          <RunPlayFrame sections={gs} idx={r.si} title="Crossed Up" sub={`Puzzle ${r.si + 1} of ${N} · ${sec.name}`}
            foot={<>
              Run total {Math.round(runSoFar + (secDone ? parts[r.si] : 0))} of {CROSSED_MAX}
              {mounted && !between ? <> · <button type="button" className="cr-lk" onClick={() => setHelpSeq((x) => x + 1)}>How to play {sec.name}</button></> : null}
              {between && peek ? <> · <button type="button" className="cr-lk" onClick={() => setPeek(false)}>Back to the results</button></> : null}
            </>}>
            {mounted ? (
              <div className="cr-host">
                <RunEmbed onResult={onSectionDone} theme={boardTheme} help={helpSeq} autostart>
                  <Game key={`${sec.key}-${sec.num}`} puzzles={[sec.puzzle]} forceNum={null} />
                </RunEmbed>
              </div>
            ) : null}
          </RunPlayFrame>
        )}

        {hydrated && playing && sec && between && !peek && (
          <div className={last ? 'cr-final' : ''}>
            <GauntletBetween
              circuitName="Crossed Up"
              sections={gs}
              results={[]}
              doneCount={r.si + 1}
              lastSec={gs[r.si]}
              upNext={nextSec || weekSec}
              upIdx={nextSec ? r.si + 1 : -1}
              stepWord="Puzzle"
              nextLine={nextSec ? (nextSec.form && nextSec.form !== nextSec.name ? `${nextSec.form} · ${nextSec.weight} points` : `${nextSec.weight} points`) : 'Which day of the week do you solve like?'}
              lastBody={doneBody()}
              lastFig={{ v: Math.round(parts[r.si]), unit: `of ${sec.weight}` }}
              lastExtra={secDone && !secDone.unknown ? <div className="cr-ink"><MiniGrid sec={sec} res={secDone} className="cr-g cr-gbig" px={150} /><span className="cr-stamp">{crossedAcc(secDone.score, secDone.total) >= 1 ? 'Inked' : 'In pencil'}</span></div> : null}
              auto={false}
              goLabel={nextSec ? `Next: ${nextSec.name}` : 'Grade My Grids'}
              fine={<>The clock waits: each grid&rsquo;s clock starts when you begin it.{mounted ? <><br /><button type="button" className="cr-lk" onClick={() => setPeek(true)}>See your finished grid</button></> : null}</>}
              onGo={advance}
              leaveHref="/circuits/crossed"
            />
          </div>
        )}

        <RunChallengeCapture gameKey={CROSSED_RUN_ID} />
        {curtainOn ? (
          <CrossedCurtain stage sections={sections} counted={counted} parts={parts} total={total} runClock={runClock}
            dateShort={dateShort} board={board} onDone={() => setCurtainDone(true)} />
        ) : null}
        {hydrated && done && !curtainOn && (
          <GauntletEndStage
            circuitName="Crossed Up"
            dateLabel={dateShort}
            sections={gs}
            results={sections.map((s, i) => ({ key: s.key, score: counted[i] ? Math.round(parts[i]) : '–' }))}
            score={total}
            unitWord="points"
            colLabel="Puzzle"
            ladder={ladder}
            ladderHeading="Which day do you solve like?"
            title={{ name: belt[1], line: belt[5], colour: rampFor(B.length - 1 - tier) }}
            topNote={`${runClock > 0 ? `${fmtClock(runClock)} in the grids` : 'Time in the grids on file'}${up ? ` · ${Math.max(1, up[0] - total)} from ${up[1]}` : ' · top of the week'}`}
            prize={<div className="cr-prize"><Week ti={tier} /><span className="cr-seal"><b>Inked</b><small>{belt[2]}</small></span></div>}
            rank={meB && Number.isFinite(Number(meB.rank)) ? Number(meB.rank) : null}
            fieldSize={bd ? (bd.overallField || bd.uniquePlayers || overall.length || null) : null}
            board={boardOut}
            rowsIn={rows}
            leaderScore={overall[0] ? Math.round(Number(overall[0].total)) : null}
            extra={<RunChallengeLine gameKey={CROSSED_RUN_ID} score={total} total={CROSSED_MAX} n={runToken()} style={{ margin: 0 }} />}
            challenge={<RunChallengeButton gameKey={CROSSED_RUN_ID} score={total} total={CROSSED_MAX} n={runToken()} t={runClock > 0 ? Math.round(runClock) : null} status={belt[1]} door />}
            meme={<RunMeme gameKey={CROSSED_RUN_ID} score={total} total={CROSSED_MAX} n={runToken()} status={belt[1]} cat="Word" />}
            more={<MoreRunsList self="crossed" ink="var(--gsx-ink)" mute="var(--gsx-ink)" line="color-mix(in srgb, var(--gsx-ink) 30%, transparent)" style={{ margin: 0 }} />}
            onShare={copyShare}
            copied={copied}
            sweep={doneAtLoad.current === false}
          />
        )}
        {/* Every other run on one card, the first time (owner, 2026-10-09). */}
        <MoreRunsPop self="crossed" ready={settled && doneAtLoad.current === false} delay={2500} fireOnLeave />
      </div>
    </>
  );
}

const CSS = WEEK_CSS + `
.cr{min-height:100vh;font-family:'Manrope',system-ui,sans-serif}
.cr *{box-sizing:border-box}
/* The embedded grid sits on the frame's pastel, not its own sheet. */
.cr-host .stage-page{min-height:0 !important;background:transparent !important;overflow-x:visible !important}
.gsx-play[data-stage-theme='light'] .cr-host .stage-page{--stg-mute:#33495a !important;--stg-mute2:#33495a !important;--stg-dim:#3d5263 !important;--stg-ink:#08222e !important}
/* ONLY THE PAGE, BLACK AND GREYS (owner, 2026-10-26: "colors used should be
   background, black, and grey or shades of either"). Inside the run every
   accent a crossword carries (its category blue, the given-letter teal, the
   right and wrong greens and reds) is remapped to the frame's ink, its greys,
   and the paper of the squares, in all five looks. */
.gsx-play .cr-host .stage-page{
  --stg-acc:var(--gsx-ink) !important;--stg-acc-ink:var(--gsx-ink) !important;--stg-acc-lt:var(--gsx-ink) !important;--stg-acc-dk:var(--gsx-ink) !important;--stg-acc-ink-lt:var(--gsx-ink) !important;
  --stg-acc-tint:color-mix(in srgb, var(--gsx-ink) 12%, transparent) !important;
  --stg-onramp:var(--gsx-card-paper, #ffffff) !important;--stg-onramp-lt:var(--gsx-card-paper, #ffffff) !important;
  --stg-brand:var(--gsx-ink) !important;
  --stg-good:var(--gsx-ink) !important;--stg-bad:var(--gsx-ink) !important;--stg-warn:var(--gsx-ink) !important;--stg-cool:var(--gsx-ink) !important;--stg-up:var(--gsx-ink) !important;--stg-dn:var(--gsx-ink) !important;
  --stg-cell-given:var(--gsx-ink) !important;
  --stg-cell:var(--gsx-card-paper, #ffffff) !important;--stg-raise:var(--gsx-card-paper, #ffffff) !important;--stg-surf:var(--gsx-card-paper, #ffffff) !important;
  --stg-surf2:color-mix(in srgb, var(--gsx-ink) 10%, var(--gsx-card-paper, #ffffff)) !important;
  --stg-chip:color-mix(in srgb, var(--gsx-ink) 10%, var(--gsx-card-paper, #ffffff)) !important;
  --stg-panel:color-mix(in srgb, var(--gsx-ink) 7%, var(--gsx-card-paper, #ffffff)) !important;
}
.cr-lk{background:none;border:0;padding:4px 2px;color:inherit;font:inherit;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
/* THE GRID SHAPES: paper squares, black squares, framed in ink. */
.cr-g{display:inline-grid;flex:none;height:26px;max-width:40px;border:1.5px solid var(--gsx-ink,#08222e);background:#08222e;gap:1px;vertical-align:middle}
.cr-g i{background:#fffdf7;font-style:normal;display:flex;align-items:center;justify-content:center;font-size:var(--fs);font-weight:800;color:#08222e;line-height:1;overflow:hidden}
.cr-g i.b{background:#08222e}
.cr-bq{display:inline-flex;align-items:center;gap:10px}
.cr-ink{display:flex;align-items:center;justify-content:center;gap:14px;padding:12px;border:2px solid var(--gsx-ink);border-radius:16px;height:100%}
.cr-g.cr-gbig{height:auto;width:min(150px,34vw);max-width:none;border-width:2.5px}
.cr-gbig,.cr-gbig i{overflow:hidden}
.cr-gbig i{animation:crpaper .35s ease both}
.cr-stamp{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#b4232a;border:2.5px solid #b4232a;border-radius:50%;padding:12px 8px;transform:rotate(-10deg);background:rgba(255,253,247,.9);animation:crseal .45s cubic-bezier(.2,.9,.2,1) .5s both}
@keyframes crpaper{from{opacity:0}to{opacity:1}}
@keyframes crseal{from{opacity:0;transform:rotate(-10deg) scale(2.4)}to{opacity:1;transform:rotate(-10deg) scale(1)}}
.cr-bars{display:flex;flex-direction:column;gap:5px;margin:4px 0 2px}
.cr-bars > span{display:flex;align-items:center;gap:8px}
.cr-bars em{width:46px;flex:none;font-style:normal;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.cr-bars i{flex:1;height:8px;border:1.5px solid var(--gsx-ink);border-radius:999px;overflow:hidden}
.cr-bars u{display:block;height:100%;background:var(--gsx-ink);text-decoration:none;transform-origin:left;animation:crfill .7s ease .6s both}
@keyframes crfill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
/* The last result hands over to the grading, not to a sixth grid. */
.cr-final .gsx-eye2{font-size:0 !important}
.cr-final .gsx-eye2::after{content:'Up Next \\00B7  All Grids In';font-size:15px}
/* ENTRY BANDS: the points and the grid's shape sit on the right, so the bare
   number goes and the form gets its own line under the name. */
.cr-gate .gsx-bn{display:none}
.cr-gate .gsx-bt{flex-direction:column;align-items:flex-start;gap:1px;white-space:normal}
.cr-gate .gsx-bt i{overflow:visible;text-overflow:clip;line-height:1.2}
.cr-gate .gsx-band{padding-top:5px;padding-bottom:5px}
/* ENTRY CENTERPIECE: 1 Across, the old start button, on paper in the stage ink. */
.cr-xw{display:block;width:100%;margin:0;padding:0;border:2px solid var(--gsx-ink);border-radius:16px;background:#fffdf7;color:#1b1a17;box-shadow:4px 4px 0 var(--gsx-ink);overflow:hidden;cursor:pointer;font:inherit;text-align:left}
.cr-xw:focus-visible{outline:3px solid var(--gsx-ink);outline-offset:3px}
.cr-xwc{display:block;padding:11px 14px 0;font:600 14px/1.35 'Newsreader',Georgia,serif;color:#3b352b}
.cr-xwc b{font:800 10.5px Manrope,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#b4232a;margin-right:6px}
.cr-xwc em{font-style:normal;font-weight:700;color:#7a6f5c}
.cr-xwr{display:flex;margin:10px 14px 13px;border:2px solid #1b1a17}
.cr-xc{position:relative;flex:1 1 0;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-left:1px solid #1b1a17;background:#fffdf7;font-style:normal;animation:crcur .5s ease var(--d) both}
.cr-xc:first-child{border-left:0}
.cr-xc.blk{background:#1b1a17;animation:none}
.cr-xc small{position:absolute;left:3px;top:1px;font:800 8px Manrope,system-ui,sans-serif;color:#1b1a17}
.cr-xc b{font:600 clamp(16px,4.4vw,26px) Manrope,system-ui,sans-serif;color:#7a7468;animation:crtype .18s ease var(--d) both}
@keyframes crtype{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
@keyframes crcur{0%{background:#fde68a}100%{background:#fffdf7}}
.cr-xw:hover .cr-xc:not(.blk){background:#fff7d6}
.cr-xw.go .cr-xc b{color:#08222e;font-weight:900;transition:color .25s ease}
.cr-xw.go .cr-xc:not(.blk){animation:crink .4s ease both}
.cr-xw.go .cr-xc:nth-child(2){animation-delay:.04s}.cr-xw.go .cr-xc:nth-child(3){animation-delay:.08s}.cr-xw.go .cr-xc:nth-child(4){animation-delay:.12s}.cr-xw.go .cr-xc:nth-child(5){animation-delay:.16s}.cr-xw.go .cr-xc:nth-child(6){animation-delay:.2s}.cr-xw.go .cr-xc:nth-child(7){animation-delay:.24s}.cr-xw.go .cr-xc:nth-child(9){animation-delay:.32s}.cr-xw.go .cr-xc:nth-child(10){animation-delay:.36s}
@keyframes crink{0%{background:#fffdf7}40%{background:#dbe6ff}100%{background:#fffdf7}}
/* THE PRIZE: the old Week, seven squares MON to PEN, in the stage ink, the
   earned day circled in red pen, and the Inked seal beside it. */
.cr-prize{position:relative;display:flex;justify-content:center;padding:18px 34px 10px 0}
.cr-prize .cw{--s:min(34px,9.6vw);border-color:var(--gsx-ink);background:#fffdf7}
.cr-prize .cw i{border-left-color:rgba(8,34,46,.35)}
.cr-prize .cw i b{color:rgba(8,34,46,.45)}
.cr-seal{position:absolute;right:-14px;top:-6px;width:62px;height:62px;border-radius:50%;border:3px solid #b4232a;color:#b4232a;background:rgba(255,253,247,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-10deg);animation:crseal .45s cubic-bezier(.2,.9,.2,1) .7s both}
.cr-seal b{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.cr-seal small{font-size:8px;font-weight:800;white-space:nowrap}
.gsx-prize:has(.cr-prize){width:min(320px,88%)}
@media(max-width:899px){
  .cr-gate .gsx-band{min-height:44px}
}
@media(min-width:900px){
  .cr-gate .gsx-split{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto auto auto;row-gap:18px}
  .cr-gate .gsx-split > .gsx-top{margin-bottom:0}
  .cr-gate .gsx-head{grid-row:2 / span 2}
  .cr-gate .gsx-piece{display:flex}
  .cr-xwc{font-size:16px;padding:14px 18px 0}
  .cr-xwr{margin:12px 18px 16px}
  .cr-g:not(.cr-gbig){height:30px;max-width:46px}
}
@media(prefers-reduced-motion:reduce){.cr *{animation:none !important;transition:none !important}}
`;
