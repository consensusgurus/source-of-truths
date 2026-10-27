'use client';

// JUDGED — the five deduction dailies as one run (owner, 2026-10-08).
//
// Ergo, Sworn, Hearsay, Docket and Alibi back to back on one page (Docket led
// and Stands ran before 2026-10-11; the page deals the day's roster), each
// dressed as a case file, then an admissions verdict: the run total decides
// which law school takes you, from Charleston to Yale (lib/law-school.js).
//
// EACH CASE IS THE REAL GAME. The client is mounted inside app/RunEmbed.jsx,
// which drops its page furniture and tells the run when it files its result;
// the start gate, the save, the hint and the /api/quiz/result row are exactly
// what that game does on its own page. So the run leaves exactly what five
// separate plays would, and the circuit board (lib/circuits 'deduction', with
// scorer 'judged') adds those five rows up with the same scorer used here.
//
// A CASE ALREADY ARGUED TODAY on its own page is not replayed: its first
// result stands, read off that game's own save and stats, and the run steps
// over it. That is the daily board's own rule (the first attempt counts).
//
// ON THE STAGE (owner, 2026-10-25): the run's four screens wear the Gauntlet
// stage look (app/GauntletScreens.jsx). The entry is the gate with a compact
// gavel and admissions letter; each case plays inside RunPlayFrame; between
// cases the ruling stays up until the player presses Next (no countdown);
// the ending climbs today's eight-school ladder to the school that takes you.

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
import { LAW_RUN_ID, LAW_CLOCK, LAW_CASE_MAX, LAW_MAX, lawLadderFor, lawTierOf, lawIndexOf, lawCasePoints, lawAcc, lawSpeed } from '@/lib/law-school';

const CLIENTS = {
  ergo: dynamic(() => import('../ergo/ErgoClient'), { ssr: false, loading: () => null }),
  sworn: dynamic(() => import('../sworn/SwornClient'), { ssr: false, loading: () => null }),
  hearsay: dynamic(() => import('../hearsay/HearsayClient'), { ssr: false, loading: () => null }),
  docket: dynamic(() => import('../docket/DocketClient'), { ssr: false, loading: () => null }),
  alibi: dynamic(() => import('../alibi/AlibiClient'), { ssr: false, loading: () => null }),
  stands: dynamic(() => import('../stands/StandsClient'), { ssr: false, loading: () => null }),
};


function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
const freshRun = () => ({ v: 1, phase: 'idle', si: 0, t0: null, results: {} });
const fmtClock = (s) => { const v = Math.max(0, Math.round(Number(s) || 0)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };

// The first (counted) play of a case today, read off the game's own save and
// stats record. Null when it has not been finished today.
function bankedOf(sec) {
  try {
    const save = JSON.parse(localStorage.getItem(`sot_${sec.key}_${sec.num}`) || 'null');
    if (!save || !save.status || save.status === 'playing') return null;
    const st = JSON.parse(localStorage.getItem(`sot_${sec.key}_stats`) || 'null') || {};
    const rec = (st.rec && st.rec[sec.num]) || (st.byNum && st.byNum[sec.num]) || null;
    if (!rec || !Number.isFinite(Number(rec.s)) || !Number(rec.t)) return { score: 0, total: 0, secs: 0, banked: true, unknown: true };
    const secs = save.t0 && save.tEnd ? Math.round((save.tEnd - save.t0) / 1000) : 0;
    return { score: Number(rec.s), total: Number(rec.t), secs, banked: true };
  } catch (e) { return null; }
}

export default function JudgedClient({ dateLabel, dateShort, sections = [] }) {
  const N = sections.length;
  // Four cases at 25 or five at 20: the run is always out of 100.
  const CASE_MAX = N ? LAW_MAX / N : LAW_CASE_MAX;
  const STORE = `sot_run_judged_${etToday()}`;
  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [leaving, setLeaving] = useState(false);
  const [holding, setHolding] = useState(null);
  const [peek, setPeek] = useState(false);
  // How to play, from the run: the game starts on its own, so its own rules
  // link is gone (RunEmbed autostart, owner 2026-10-27).
  const [helpSeq, setHelpSeq] = useState(0);
  const [copied, setCopied] = useState(false);
  const doneAtLoad = useRef(null);
  const [settled, setSettled] = useState(false);
  // The embedded boards follow the stage's look: dark ink on the pastel
  // (light register) unless the reader picked one of the black looks.
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
  const board = useCircuitBoard(LAW_RUN_ID, hydrated && done);

  // What counts for each case: the first finish of the day, wherever it happened.
  const counted = useMemo(() => sections.map((sec) => banked[sec.key] || r.results[sec.key] || null), [sections, banked, r.results]);
  // Each case: half accuracy and half speed (lib/law-school.js).
  const parts = counted.map((c, i) => (c ? lawCasePoints(sections[i].key, c.score, c.total, c.secs, CASE_MAX) : 0));
  const total = Math.round(parts.reduce((a, b) => a + b, 0));
  const allBanked = N > 0 && sections.every((s) => banked[s.key]);

  function start() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      const cur = rRef.current;
      if (allBanked) { commit({ ...cur, phase: 'done', t0: cur.t0 || Date.now(), tEnd: Date.now() }); return; }
      commit({ ...cur, phase: 'playing', si: 0, t0: cur.t0 || Date.now() });
      try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) {}
    }, 520);
  }

  // A case reports its filed result. The finished board holds for its finish
  // beat (RunEmbed plays it) and a moment more, then the ruling covers it and
  // stays up until the player presses Next (owner, 2026-10-16: Judged never
  // advances by itself). The board stays under the ruling, one tap away.
  const onSectionDone = useCallback((res) => {
    const cur = rRef.current;
    const sec = sections[cur.si];
    if (!sec || !res || res.key !== sec.key || cur.results[sec.key]) return;
    const secs = res.t0 ? Math.max(1, Math.round(((res.tEnd || Date.now()) - res.t0) / 1000)) : 0;
    commit({ ...cur, results: { ...cur.results, [sec.key]: { score: res.score, total: res.total, secs } } });
    setHolding(sec.key);
    setTimeout(() => setHolding((h) => (h === sec.key ? null : h)), Math.max(1400, (res.beatMs || 0) + 600));
  }, [sections, commit]);

  const sec = playing ? sections[r.si] : null;
  const secDone = sec ? (banked[sec.key] || r.results[sec.key]) : null;
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

  // Today's rotating ladder (lib/law-school.js): Yale and Harvard fixed, the
  // rungs below them dealt from their pools by the Eastern date.
  const L = useMemo(() => lawLadderFor(etToday()), []);
  const tier = lawTierOf(total);
  const school = L[tier];

  function shareText() {
    const per = sections.map((s, i) => `${s.name} ${counted[i] ? Math.round(parts[i]) : '-'}`).join(' · ');
    const code = sections.length === 5 ? sections.map((s, i) => Math.round(parts[i])).join('-') : '';
    const link = `mindloftdaily.com/judged${code ? `?s=${code}&t=${total}&d=${etToday()}` : ''}`;
    return `Judged · ${dateShort} · ${total}/${LAW_MAX}\nAdmitted to ${school[1]}, admissions score ${lawIndexOf(total)}.${tier > 0 ? `\nWaitlisted at ${L[tier - 1][1]}, ${Math.max(1, L[tier - 1][0] - total)} short.` : ''}\n${per}\n${withRef(link)}`;
  }
  function copyShare() {
    const text = done ? shareText() : `Judged: five logic cases, right and fast. Your score decides which law school lets you in.\n${withRef('mindloftdaily.com/judged')}`;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  // The stage's sections: one ladder step per case, in play order.
  const gs = useMemo(() => sections.map((s, i) => ({ ...s, slot: i, questions: [] })), [sections]);
  const runSoFar = sections.slice(0, r.si).reduce((a, s, i) => a + (counted[i] ? parts[i] : 0), 0);
  const Game = sec ? CLIENTS[sec.key] : null;
  const mounted = !!(Game && sec && !banked[sec.key]);

  // The ending settles once the count-up and the climb have landed; the
  // every-other-run card waits for that, as it did after the old verdict.
  useEffect(() => {
    if (!hydrated || !done) return undefined;
    const t = setTimeout(() => setSettled(true), doneAtLoad.current === false ? 6500 : 0);
    return () => clearTimeout(t);
  }, [hydrated, done]);

  // The case just ruled on, for the between card.
  function rulingBody() {
    if (!sec || !secDone) return null;
    const earlier = banked[sec.key] && !r.results[sec.key];
    const half = CASE_MAX / 2;
    const acc = lawAcc(secDone.score, secDone.total);
    const spd = lawSpeed(sec.key, secDone.secs);
    return (
      <>
        <b>Case {r.si + 1} · {sec.name}{earlier ? ', argued earlier today' : ''}</b>
        {secDone.unknown ? <span>Result on file. Your first result stands.</span> : (
          <>
            <span>{secDone.score} of {secDone.total} right{secDone.secs ? ` in ${fmtClock(secDone.secs)}` : ''}</span>
            <span>Right {Math.round(half * acc)} of {half} · Fast {Math.round(half * acc * spd)} of {half}</span>
            <span>Full speed marks under {fmtClock(LAW_CLOCK[sec.key][0])}</span>
          </>
        )}
      </>
    );
  }

  const nextSec = playing && !last ? gs[r.si + 1] : null;
  const verdictSec = { key: '__verdict', name: 'Verdict', slot: N, questions: [] };

  // The end screen's figures off today's board.
  const bd = board && board.data;
  const sf = bd && bd.stageField;
  const avg = stageAvg(sf, sections);
  const caseRows = sections.map((s, i) => {
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
    return out.length ? { rows: out, field: bd.overallField || bd.uniquePlayers || null, href: '/judged/leaderboard' } : null;
  })();
  // Today's eight schools, bottom to top, each rung in the school's colour.
  const ladder = [...L].reverse().map((t, i) => ({ min: t[0], name: t[1], line: t[4], colour: rampFor(i), chip: t[5] }));

  return (
    <>
      {!hydrated ? <GauntletCover sections={gs} /> : null}
      <div className="jd" data-sot-wait="">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />

        {hydrated && r.phase === 'idle' && (
          <div className="jd-gate">
            <GauntletGate
              circuitName="Judged"
              banner={<RunOtherDeviceBar runId={LAW_RUN_ID} keys={sections.map((s) => s.key)} show={hydrated && r.phase === 'idle' && !r.t0 && !allBanked} />}
              dateLabel={dateShort}
              sections={gs}
              lineFor={(s) => s.tag || s.chip || ''}
              bandNote={(s) => (banked[s.key] ? (banked[s.key].unknown ? 'Argued' : `${banked[s.key].score}/${banked[s.key].total} stands`) : `Case ${gs.indexOf(s) + 1}`)}
              headline={<>{NUM_WORDS[N] || N} Cases.<br />One Letter.</>}
              rule={`${CASE_MAX} points a case: half for right, half for fast.`}
              lineup="Your score decides which law school lets you in."
              startLabel={leaving ? 'Order in the court…' : (allBanked ? 'Open your letter' : 'Begin the exam')}
              fieldLine={Object.keys(banked).length ? 'Argued one today? Your first result stands.' : null}
              centerpiece={<Gavel strike={leaving} allBanked={allBanked} top={L[0]} bottom={L[L.length - 1]} n={L.length} onStart={start} />}
              onStart={start}
            />
          </div>
        )}

        {hydrated && playing && sec && (
          <RunPlayFrame sections={gs} idx={r.si} title="Judged" sub={`Case ${r.si + 1} of ${N} · ${sec.name}`}
            foot={<>Run total {Math.round(runSoFar + (secDone ? parts[r.si] : 0))} of {LAW_MAX}{mounted && !between ? <> · <button type="button" className="jd-back" onClick={() => setHelpSeq((x) => x + 1)}>How to play {sec.name}</button></> : null}{between && peek ? <> · <button type="button" className="jd-back" onClick={() => setPeek(false)}>Back to the ruling</button></> : null}</>}>
            {mounted ? (
              <div className="jd-host">
                <RunEmbed onResult={onSectionDone} theme={boardTheme} help={helpSeq} autostart>
                  <Game key={`${sec.key}-${sec.num}`} puzzles={[sec.puzzle]} forceNum={null} />
                </RunEmbed>
              </div>
            ) : null}
          </RunPlayFrame>
        )}

        {hydrated && playing && sec && between && !peek && (
          <div className={last ? 'jd-final' : ''}>
            <GauntletBetween
              circuitName="Judged"
              sections={gs}
              results={[]}
              doneCount={r.si + 1}
              lastSec={gs[r.si]}
              upNext={nextSec || verdictSec}
              upIdx={nextSec ? r.si + 1 : -1}
              stepWord="Case"
              nextLine={nextSec ? (nextSec.tag || nextSec.chip || '') : 'Which law school takes you?'}
              lastBody={rulingBody()}
              lastFig={{ v: Math.round(parts[r.si]), unit: `of ${CASE_MAX}` }}
              auto={false}
              goLabel={nextSec ? `Next: ${nextSec.name}` : 'Send My File In'}
              fine={<>The clock waits: each case&rsquo;s clock starts when you begin it.{mounted ? <><br /><button type="button" className="jd-peek" onClick={() => setPeek(true)}>See your finished board</button></> : null}</>}
              onGo={advance}
              leaveHref="/circuits/deduction"
            />
          </div>
        )}

        <RunChallengeCapture gameKey={LAW_RUN_ID} />
        {hydrated && done && (
          <GauntletEndStage
            circuitName="Judged"
            dateLabel={dateShort}
            sections={gs}
            results={sections.map((s, i) => ({ key: s.key, score: counted[i] ? Math.round(parts[i]) : '–' }))}
            score={total}
            unitWord="points"
            colLabel="Case"
            ladder={ladder}
            ladderHeading="Which school takes you?"
            title={{ name: school[1], line: school[4], colour: rampFor(L.length - 1 - tier) }}
            topNote={`Admissions score ${lawIndexOf(total)}`}
            rank={meB && Number.isFinite(Number(meB.rank)) ? Number(meB.rank) : null}
            fieldSize={bd ? (bd.overallField || bd.uniquePlayers || overall.length || null) : null}
            board={boardOut}
            rowsIn={caseRows}
            leaderScore={overall[0] ? Math.round(Number(overall[0].total)) : null}
            extra={<RunChallengeLine gameKey={LAW_RUN_ID} score={total} total={LAW_MAX} n={runToken()} style={{ margin: 0 }} />}
            challenge={<RunChallengeButton gameKey={LAW_RUN_ID} score={total} total={LAW_MAX} n={runToken()} status={`Admitted to ${school[1]}`} door />}
            meme={<RunMeme gameKey={LAW_RUN_ID} score={total} total={LAW_MAX} n={runToken()} status={`Admitted to ${school[1]}`} cat="Logic" />}
            more={<MoreRunsList self="judged" ink="var(--gsx-ink)" mute="var(--gsx-ink)" line="color-mix(in srgb, var(--gsx-ink) 30%, transparent)" style={{ margin: 0 }} />}
            onShare={copyShare}
            copied={copied}
            sweep={doneAtLoad.current === false}
          />
        )}
        {/* Every other run on one card, the first time (owner, 2026-10-09). */}
        <MoreRunsPop self="judged" ready={settled && doneAtLoad.current === false} delay={2500} fireOnLeave />
      </div>
    </>
  );
}

const NUM_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

// THE ENTRY'S CENTERPIECE (owner, 2026-10-25): the gavel that used to be the
// Start button, struck on the block, beside the admissions letter it decides.
// Tapping it starts the exam. Ink lines on the pastel, the letter on paper.
function Gavel({ strike, allBanked, top, bottom, n, onStart }) {
  return (
    <button type="button" className={`jd-gv${strike ? ' strike' : ''}`} onClick={onStart} aria-label={allBanked ? 'Open your letter' : 'Begin the exam'}>
      <svg className="jd-gvs" viewBox="0 0 120 80" aria-hidden="true">
        <g className="jd-arm">
          <rect x="56" y="8" width="9" height="50" rx="3" fill="currentColor" opacity=".85" />
          <rect x="36" y="2" width="48" height="20" rx="6" fill="currentColor" />
          <rect x="36" y="8" width="48" height="3" fill="var(--gsx-bg)" opacity=".5" />
        </g>
        <rect x="28" y="66" width="64" height="11" rx="3" fill="currentColor" />
        <rect x="35" y="61" width="50" height="7" rx="2" fill="currentColor" opacity=".7" />
      </svg>
      <span className="jd-lt">
        <span className="jd-ltf">Office of Admissions</span>
        <span className="jd-lts">{allBanked ? 'Every case argued today' : 'Your file is open'}</span>
        <span className="jd-ltl"><i style={{ background: top ? top[5] : undefined }} />{top ? top[1] : ''}</span>
        <span className="jd-ltd">{n} schools today, down to {bottom ? bottom[2] : ''}</span>
      </span>
    </button>
  );
}

const CSS = `
.jd{min-height:100vh;font-family:'Manrope',system-ui,sans-serif}
.jd *{box-sizing:border-box}
/* The embedded board sits on the frame's pastel, not its own sheet. */
.jd-host .stage-page{min-height:0 !important;background:transparent !important;overflow-x:visible !important}
/* On the pastel the light register's grey prose went faint: the muted inks
   darken toward the stage's one ink, the boards keep their own surfaces. */
.gsx-play[data-stage-theme='light'] .jd-host .stage-page{--stg-mute:#33495a !important;--stg-mute2:#33495a !important;--stg-dim:#3d5263 !important;--stg-ink:#08222e !important}
.jd-back,.jd-peek{background:none;border:0;padding:4px 2px;color:inherit;font:inherit;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.jd-peek{margin-top:4px;font-size:13px}
/* The last ruling hands over to the verdict, not to a sixth case. */
.jd-final .gsx-eye2{font-size:0 !important}
.jd-final .gsx-eye2::after{content:'Up Next \\00B7  All Cases Argued';font-size:15px}
/* ENTRY BANDS: "Case N" sits on the right, so the bare number goes, and the
   tagline gets its own line under the name so it is never cut off. */
.jd-gate .gsx-bn{display:none}
.jd-gate .gsx-bt{flex-direction:column;align-items:flex-start;gap:1px;white-space:normal}
.jd-gate .gsx-bt i{overflow:visible;text-overflow:clip;line-height:1.2}
.jd-gate .gsx-band{padding-top:5px;padding-bottom:5px}
/* ENTRY CENTERPIECE */
.jd-gv{flex:1;display:flex;align-items:center;justify-content:center;gap:12px;overflow:hidden;width:100%;margin:0;padding:12px 14px;border:2px solid var(--gsx-ink);border-radius:18px;background:transparent;color:var(--gsx-ink);font:inherit;cursor:pointer;text-align:left}
.jd-gv:focus-visible{outline:3px solid var(--gsx-ink);outline-offset:3px}
.jd-gvs{flex:none;width:96px;height:64px;overflow:visible}
.jd-arm{transform-origin:60px 56px;transform:rotate(-24deg);transition:transform .25s cubic-bezier(.6,0,.8,.4)}
.jd-gv:hover .jd-arm{transform:rotate(-30deg)}
.jd-gv.strike .jd-arm,.jd-gv:active .jd-arm{transform:rotate(4deg);transition:transform .12s cubic-bezier(.7,0,1,.6)}
.jd-gv.strike{animation:jdthud .3s .12s ease-out}
@keyframes jdthud{30%{transform:translateY(3px)}}
.jd-lt{flex:0 1 210px;min-width:0;max-width:210px;display:flex;flex-direction:column;gap:3px;padding:10px 12px;border-radius:8px;background:#fffdf7;color:#08222e;border:2px solid var(--gsx-ink);box-shadow:4px 4px 0 var(--gsx-ink);transform:rotate(-1.5deg)}
.jd-ltf{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.jd-lts{font-size:15px;font-weight:800;line-height:1.2}
.jd-ltl{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;min-width:0}
.jd-ltl i{flex:none;width:10px;height:10px;border-radius:50%}
.jd-ltd{font-size:11.5px;font-weight:700;opacity:.75}
@media(min-width:900px){
  .jd-gate .gsx-split{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto auto auto;row-gap:18px}
  .jd-gate .gsx-split > .gsx-top{margin-bottom:0}
  .jd-gate .gsx-head{grid-row:2 / span 2}
  .jd-gate .gsx-piece{display:flex}
  .jd-gv{padding:16px 18px}
  .jd-gvs{width:120px;height:80px}
  .jd-lt{max-width:280px}
}
@media(prefers-reduced-motion:reduce){.jd *{animation:none !important;transition:none !important}}
`;
