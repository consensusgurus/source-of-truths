'use client';

// ENTER THE DOJO — three sudokus as one run (owner, 2026-10-12).
//
// Sixes, Suds, then the day's variant (lib/dojo.js), back to back on one page,
// each dressed as a form, then a belt: the run total decides which belt you tie
// on, from white to black. It is Judged's machinery with a sudoku roster.
//
// EACH GRID IS THE REAL GAME. The client is mounted inside app/RunEmbed.jsx,
// which drops its page furniture and tells the run when it files its result;
// the start gate, the save, the hint and the /api/quiz/result row are exactly
// what that game does on its own page. So the run leaves exactly what three
// separate plays would, and the circuit board (lib/circuits 'dojo', scorer
// 'dojo') adds those rows up with the same scorer used here.
//
// A GRID ALREADY SOLVED TODAY on its own page is not replayed: its first
// result stands, read off that game's own save and stats, and the run steps
// over it. That is the daily board's own rule (the first attempt counts).
//
// THE PREGAME is the dojo's entrance: two paper doors that ARE the Start
// button, and three hanging scrolls naming the day's forms. The doors slide
// apart before the first grid. THE ENDING is a grading: the sheet scores form
// by form while the belt on the left is dyed up the ladder color by color,
// then the examiner's seal comes down and the belt is tied. The ending starts
// on its own after the last grid, as Judged's and Price Check's do.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readStageTheme } from '@/lib/stage-theme';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import RunEmbed from '../RunEmbed';
import NextDrop from '../NextDrop';
import { RunChallengeButton, RunChallengeLine, RunChallengeCapture, runToken, RunMeme } from '../RunChallenge';
import MoreRunsPop, { MoreRunsList } from '../circuits/MoreRuns';
import useCircuitBoard from '../circuits/useCircuitBoard';
import RunScorecard, { boardRows, stageRank, stageAvg } from '../circuits/RunScorecard';
import RunNextSlot from '../circuits/RunNextSlot';
import { rampFor } from '@/lib/circuits';
import { withRef } from '@/lib/referrals';
import { isMobileDevice } from '@/lib/is-mobile';
import { DOJO_RUN_ID, DOJO_BELTS, DOJO_CLOCK, DOJO_MAX, dojoTierOf, dojoGridPoints, dojoAcc, dojoSpeed } from '@/lib/dojo';
import RunBackLink from '../circuits/RunBackLink';
import DyeCurtain from './DyeCurtain';
import { GauntletGate, GauntletEndStage, LookButton } from '../GauntletScreens';
import { usePhoneStage } from '../WordStage';
import useSudokuPastel from '../SudokuPastel';

const CLIENTS = {
  sixes: dynamic(() => import('../sixes/SixesClient'), { ssr: false, loading: () => null }),
  suds: dynamic(() => import('../suds/SudsClient'), { ssr: false, loading: () => null }),
  sando: dynamic(() => import('../sando/SandoClient'), { ssr: false, loading: () => null }),
  quilt: dynamic(() => import('../quilt/QuiltClient'), { ssr: false, loading: () => null }),
  mercury: dynamic(() => import('../mercury/MercuryClient'), { ssr: false, loading: () => null }),
  arrow: dynamic(() => import('../arrow/ArrowClient'), { ssr: false, loading: () => null }),
  cages: dynamic(() => import('../cages/CagesClient'), { ssr: false, loading: () => null }),
  knight: dynamic(() => import('../knight/KnightClient'), { ssr: false, loading: () => null }),
  polka: dynamic(() => import('../polka/PolkaClient'), { ssr: false, loading: () => null }),
  frame: dynamic(() => import('../frame/FrameClient'), { ssr: false, loading: () => null }),
  diag: dynamic(() => import('../diag/DiagClient'), { ssr: false, loading: () => null }),
  sumo: dynamic(() => import('../sumo/SumoClient'), { ssr: false, loading: () => null }),
};

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const SERIF = "'Newsreader', Georgia, 'Times New Roman', serif";
const B = DOJO_BELTS;
const LOW = B.length - 1;
const NUMS = ['One', 'Two', 'Three', 'Four', 'Five'];

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
const freshRun = () => ({ v: 1, phase: 'idle', si: 0, t0: null, results: {} });
const fmtClock = (s) => { const v = Math.max(0, Math.round(Number(s) || 0)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };

// The first (counted) play of a grid today, read off the game's own save and
// stats record. Null when it has not been finished today.
function bankedOf(sec) {
  try {
    const save = JSON.parse(localStorage.getItem(`sot_${sec.key}_${sec.num}`) || 'null');
    if (!save || !save.status || save.status === 'playing') return null;
    const st = JSON.parse(localStorage.getItem(`sot_${sec.key}_stats`) || 'null') || {};
    const rec = (st.rec && st.rec[sec.num]) || (st.byNum && st.byNum[sec.num]) || null;
    const secs = save.t0 && save.tEnd ? Math.round((save.tEnd - save.t0) / 1000) : 0;
    // THE SAVE'S VERDICT WINS (2026-10-13). A won board is a solve and a
    // revealed one is not, whatever the stats record says: that record is
    // write-once and mergeServerStats fills it from the player's FIRST server
    // row, which is an abandoned 0 when the run was paused mid-grid. The board
    // already counts the completed row over the abandon, so this agrees with it.
    if (save.status === 'won') return { score: 10, total: 10, secs, banked: true };
    if (save.status === 'revealed') return { score: 0, total: 10, secs, banked: true };
    if (!rec || !Number.isFinite(Number(rec.s)) || !Number(rec.t)) return { score: 0, total: 0, secs: 0, banked: true, unknown: true };
    return { score: Number(rec.s), total: Number(rec.t), secs, banked: true };
  } catch (e) { return null; }
}

// A belt drawn in CSS: the band, the knot, two tails, and the rank tab on the
// right tail (gold bars on black, a darker tab on every other color).
function Belt({ ti, tied = true, dye = false, small = false }) {
  const t = B[ti];
  return (
    <div className={`bt${tied ? ' tied' : ''}${dye ? ' dye' : ''}${small ? ' sm' : ''}${ti === LOW ? ' white' : ''}`} style={{ '--b': t[3], '--st': t[4] }} aria-hidden="true">
      <i className="bt-band" />
      <i className="bt-tail l" />
      <i className="bt-tail r"><b /></i>
      <i className="bt-knot" />
    </div>
  );
}

export default function DojoClient({ dateLabel, dateShort, sections = [], clocks: clocksIn = null }) {
  // The day's clocks come from the server (lib/dojo-clocks.js); the seed covers a
  // page served before they could be measured.
  const CLK = clocksIn || DOJO_CLOCK;
  const N = sections.length;
  const STORE = `sot_run_dojo_${etToday()}`;
  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [leaving, setLeaving] = useState(false);
  const [holding, setHolding] = useState(null);
  // How to play, from the run: the embedded grid has no cap of its own.
  const [helpSeq, setHelpSeq] = useState(0);
  const [copied, setCopied] = useState(false);
  // THE BOARD'S LIGHT SWITCH. Light or dark for the grids only; the run's own
  // page stays on its dark ground. The board OPENS IN THE READER'S OWN PAGE
  // SETTING (owner, 2026-10-20: never a default of its own), and the switch
  // is a choice for today only: it is kept under today's date so a reload mid
  // run holds it, and tomorrow the board follows the page setting again.
  // Read in an effect so the first paint matches the server.
  const [boardTheme, setBoardTheme] = useState('dark');
  useEffect(() => {
    let t = readStageTheme();
    try { const v = JSON.parse(window.localStorage.getItem('sot_dojo_board2') || 'null'); if (v && v.day === etToday() && (v.t === 'light' || v.t === 'dark')) t = v.t; } catch (e) {}
    setBoardTheme(t);
  }, []);
  const flipBoard = () => setBoardTheme((cur) => { const next = cur === 'light' ? 'dark' : 'light'; try { window.localStorage.setItem('sot_dojo_board2', JSON.stringify({ t: next, day: etToday() })); } catch (e) {} return next; });
  const doneAtLoad = useRef(null);
  const [settled, setSettled] = useState(false);
  // THE PHONE DOJO (owner, 2026-10-24): on a phone the ending is the gauntlet
  // stage's screen and the grids play on the pastel sudoku register. The
  // ENTRANCE is the stage gate on every width since 2026-10-26.
  const phone = usePhoneStage();
  const [endOpen, setEndOpen] = useState(true);

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
  const pastel = useSudokuPastel(hydrated && playing);
  // The stage ending counts as settled for the more-runs card that follows it.
  useEffect(() => { if (hydrated && done && phone && endOpen) setSettled(true); }, [hydrated, done, phone, endOpen]);
  const board = useCircuitBoard(DOJO_RUN_ID, hydrated && done);

  const counted = useMemo(() => sections.map((sec) => r.results[sec.key] || banked[sec.key] || null), [sections, banked, r.results]);
  const parts = counted.map((c, i) => (c ? dojoGridPoints(sections[i].key, c.score, c.total, c.secs, CLK) : 0));
  const total = Math.round(parts.reduce((a, b) => a + b, 0));
  const allBanked = N > 0 && sections.every((s) => banked[s.key]);

  function start(now = false) {
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      const cur = rRef.current;
      if (allBanked) { commit({ ...cur, phase: 'done', t0: cur.t0 || Date.now(), tEnd: Date.now() }); return; }
      commit({ ...cur, phase: 'playing', si: 0, t0: cur.t0 || Date.now() });
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    }, now === true ? 0 : 980);
  }

  // A grid reports its filed result. The finished board holds for a beat so
  // the player sees it solved, then the form card takes its place.
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
    if (cur.si >= N - 1) commit({ ...cur, phase: 'done', tEnd: Date.now() });
    else commit({ ...cur, si: cur.si + 1 });
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }
  // THE LAST GRID ROLLS STRAIGHT INTO THE GRADING, no button.
  useEffect(() => {
    if (!between || !last) return undefined;
    const t = setTimeout(() => advance(), 1900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [between, last]);

  const tier = dojoTierOf(total);
  const belt = B[tier];

  function shareText() {
    const per = sections.map((s, i) => `${s.name} ${counted[i] ? Math.round(parts[i]) : '-'}`).join(' · ');
    const code = sections.length === 3 ? sections.map((s, i) => Math.round(parts[i])).join('-') : '';
    const link = `mindloftdaily.com/dojo${code ? `?s=${code}&t=${total}&d=${etToday()}` : ''}`;
    return `Enter the Dojo · ${dateShort} · ${total}/${DOJO_MAX}\n${belt[1]}.${tier > 0 ? `\nNext up: ${B[tier - 1][1]}, ${Math.max(1, B[tier - 1][0] - total)} short.` : ''}\n${per}\n${withRef(link)}`;
  }
  function copyShare() {
    const text = done ? shareText() : `Enter the Dojo: three sudokus in one sitting, fast and clean. Your score ties on your belt, white to black.\n${withRef('mindloftdaily.com/dojo')}`;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const VARS = { '--dj-ground': '#0b0f1a', '--dj-panel': '#0d1220', '--dj-surf': 'rgba(255,255,255,.045)', '--dj-line': 'rgba(255,255,255,.12)', '--dj-ink': '#e9edf4', '--dj-mute': '#9aa8c4', '--dj-cta': '#7dd3fc', '--dj-cta-ink': '#08222e', '--dj-gold': '#e9cf7f', '--dj-good': '#6ee7b7', '--dj-bad': '#fb7185', '--dj-paper': '#f6f1e4', '--dj-wood': '#3a2416', '--dj-seal': '#b4232a' };
  sections.forEach((s) => { VARS[`--dj-${s.key}`] = s.color; });
  const runSoFar = sections.slice(0, r.si).reduce((a, s, i) => a + (counted[i] ? parts[i] : 0), 0);
  const Game = sec ? CLIENTS[sec.key] : null;

  return (
    <div className="stage-page dj" data-sot-wait="" data-stage-theme="dark" style={{ ...VARS, minHeight: '100vh', background: 'var(--dj-ground)', color: 'var(--dj-ink)', fontFamily: SANS, overflowX: 'hidden', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={`dj-cap${done ? ' vf' : ''}`}>
        {done && <RunBackLink />}
        <Link href="/" className="dj-home">Mind Loft</Link>
        <b>Enter the Dojo</b>
        <span className="dj-capd">{dateShort}</span>
        {playing && <span className="dj-capt">{sections.map((s, i) => <i key={s.key} className={i < r.si ? 'd' : i === r.si ? 'on' : ''} style={{ background: i <= r.si ? `var(--dj-${s.key})` : undefined }} title={s.name} />)}</span>}
        {!playing && <a className="dj-lb" href="/dojo/leaderboard">Leaderboard</a>}
      </div>

      {/* ONE ENTRY ON EVERY WIDTH (owner, 2026-10-26): the stage gate the other
          runs use, with the sudoku doors as its picture. The old desktop entry
          (paper doors over a wall of scrolls) is retired. */}
      {hydrated && r.phase === 'idle' && (
        <GauntletGate
          circuitName="Enter the Dojo"
          dateLabel={dateShort}
          sections={sections.map((s, i) => ({ ...s, slot: i, questions: [] }))}
          lineFor={(s) => (s.form && s.form !== s.name ? s.form : (s.chip || ''))}
          bandNote={(s) => (banked[s.key] ? 'Done' : `${s.weight} pts`)}
          headline={<>{(NUMS[N - 1] || String(N))} Forms.<br />One Belt.</>}
          rule="Solving counts half, speed the other half."
          startLabel={leaving ? 'Opening\u2026' : (allBanked ? 'See your belt' : 'Step onto the mat')}
          lineup="Tap the doors to step onto the mat."
          centerpiece={<PhoneDoors open={leaving} sign={leaving ? `Form One \u00B7 ${sections[0] ? sections[0].name : ''}` : (allBanked ? 'All three done today' : 'The mat is ready')} onOpen={() => { if (!leaving) start(); }} />}
          onStart={() => { if (!leaving) start(); }}
        />
      )}
      {hydrated && playing && sec && (
        <section className="dj-play" style={{ '--c': `var(--dj-${sec.key})` }}>
          <div className="dj-sechd">
            <span className="dj-sectag">Form {NUMS[r.si] || r.si + 1} · {sec.form}</span>
            <b>{sec.name}</b>
            {!between && Game && !banked[sec.key] && (
              <button type="button" className="dj-tg" onClick={() => setHelpSeq((n) => n + 1)} title={`How to play ${sec.name}`}>
                <span aria-hidden="true">?</span> How to play
              </button>
            )}
            {!between && Game && !banked[sec.key] && !phone && (
              <button type="button" className="dj-tg" onClick={flipBoard} aria-pressed={boardTheme === 'light'} title={boardTheme === 'light' ? 'Switch the board to dark' : 'Switch the board to light'}>
                <span aria-hidden="true">{boardTheme === 'light' ? '\u263E' : '\u2600'}</span> {boardTheme === 'light' ? 'Dark board' : 'Light board'}
              </button>
            )}
            {phone && pastel.on ? <LookButton look={pastel.look} onFlip={pastel.flip} className="dj-look" /> : null}
            <span className="dj-run">Run total {Math.round(runSoFar + (between ? parts[r.si] : 0))}</span>
          </div>
          {!between && Game && !banked[sec.key] && (
            <div className={`dj-host${boardTheme === 'light' ? ' lt' : ''}`}>
              <RunEmbed onResult={onSectionDone} theme={boardTheme} help={helpSeq} autostart={phone}>
                <Game key={`${sec.key}-${sec.num}`} puzzles={[sec.puzzle]} forceNum={null} />
              </RunEmbed>
            </div>
          )}
          {between && (
            <div className="dj-between">
              <div className="eb">{sec.name} · {banked[sec.key] && !r.results[sec.key] ? 'solved earlier today, the first time stands' : `form ${(NUMS[r.si] || r.si + 1).toString().toLowerCase()} done`}</div>
              <div className="dj-bscore">{Math.round(parts[r.si])}<small>/{sec.weight}</small></div>
              {secDone.unknown ? <div className="dj-braw">Result on file</div> : (
                <div className="dj-split">
                  <div><span>Solve</span><b>{dojoAcc(secDone.score, secDone.total) >= 1 ? 'Clean' : 'Unfinished'}</b><i style={{ width: `${Math.round(100 * dojoAcc(secDone.score, secDone.total))}%` }} /></div>
                  <div><span>Speed</span><b>{secDone.secs ? fmtClock(secDone.secs) : 'no clock'}</b><i style={{ width: `${Math.round(100 * dojoSpeed(sec.key, secDone.secs, CLK))}%` }} /><small>full marks under {fmtClock((CLK[sec.key] || DOJO_CLOCK[sec.key])[0])}</small></div>
                </div>
              )}
              {!last ? (
                <button type="button" className="start" onClick={advance}>Next: Form {NUMS[r.si + 1] || r.si + 2}, {sections[r.si + 1].name} <span aria-hidden="true">&rarr;</span></button>
              ) : (
                <div className="dj-rolling" role="status">The examiner is grading your forms<span className="dj-dots" aria-hidden="true"><i /><i /><i /></span></div>
              )}
            </div>
          )}
        </section>
      )}

      <RunChallengeCapture gameKey={DOJO_RUN_ID} />
      {hydrated && done && phone && endOpen && (
        <GauntletEndStage
          circuitName="Enter the Dojo"
          dateLabel={dateShort}
          sections={sections.map((s, i) => ({ ...s, slot: i }))}
          results={sections.map((s, i) => ({ key: s.key, score: counted[i] ? Math.round(parts[i]) : '\u2013' }))}
          score={total}
          unitWord="points"
          colLabel="Form"
          title={{ name: belt[1], colour: '#a5b4fc', line: tier > 0 ? `${Math.max(1, B[tier - 1][0] - total)} points short of ${B[tier - 1][1]}` : 'Top of the ladder' }}
          rank={board.data && board.data.me && Number.isFinite(board.data.me.rank) ? board.data.me.rank : null}
          fieldSize={board.data ? (board.data.uniquePlayers || (Array.isArray(board.data.overall) ? board.data.overall.length : null)) : null}
          challenge={<RunChallengeButton gameKey={DOJO_RUN_ID} score={total} total={DOJO_MAX} n={runToken()} status={belt[1]} door />}
          meme={<RunMeme gameKey={DOJO_RUN_ID} score={total} total={DOJO_MAX} n={runToken()} status={belt[1]} cat="Sudoku" />}
          onShare={copyShare}
          copied={copied}
          onDetails={() => { setEndOpen(false); setSettled(true); }}
          sweep={doneAtLoad.current === false}
        />
      )}
      {hydrated && done && !(phone && endOpen) && (
        <Grading key="grading" sections={sections} counted={counted} parts={parts} total={total} dateLabel={dateLabel} dateShort={dateShort}
          animate={doneAtLoad.current === false && !phone} board={board} clocks={CLK} onShare={copyShare} copied={copied}
          onSettled={() => setSettled(true)} />
      )}
      <MoreRunsPop self="dojo" ready={settled && doneAtLoad.current === false} delay={2500} fireOnLeave />
    </div>
  );
}

// THE PHONE DOORS (owner, 2026-10-24): the Dojo's paper doors on the gauntlet
// entry screen, each panel's lattice drawn as a 3x3 sudoku box. A tap slides
// them apart and the first grid starts by itself (RunEmbed autostart).
const DOOR_L = [5, 0, 8, 0, 2, 0, 9, 0, 4];
const DOOR_R = [0, 3, 0, 7, 0, 1, 0, 6, 0];
function PhoneDoors({ open, sign, onOpen }) {
  return (
    <button type="button" className={`pd${open ? ' open' : ''}`} onClick={onOpen} aria-label="Open the doors and start">
      <span className="pd-f">
        <span className="pd-p l">{DOOR_L.map((d, i) => <span key={i}>{d || ''}</span>)}<i /></span>
        <span className="pd-p r">{DOOR_R.map((d, i) => <span key={i}>{d || ''}</span>)}<i /></span>
      </span>
      <span className="pd-sign">{sign}</span>
    </button>
  );
}

// ─── the belts, top to bottom ───────────────────────────────────────────────
function Ladder({ at }) {
  return (
    <ol className="lad">
      {B.map((t, i) => (
        <li key={t[2]} className={at === i ? 'me' : ''} style={{ '--b': t[3], '--st': t[4] }}>
          <span className="lp" aria-hidden="true"><i /></span>
          <span className="ln"><b>{t[1]}</b><small>{t[5]}</small></span>
          <span className="lc">{i === LOW ? 'any score' : `${t[0]}+`}</span>
        </li>
      ))}
    </ol>
  );
}

// The next belt up, and how far short. A near miss reads as nearly full.
function NextBelt({ total, ti }) {
  if (ti <= 0) return <div className="ms top"><span>Top of the ladder</span><b>No belt above black.</b></div>;
  const up = B[ti - 1];
  const short = Math.max(1, up[0] - total);
  const fill = Math.max(4, Math.min(97, 100 * total / up[0]));
  return (
    <div className="ms" style={{ '--b': up[3], '--st': up[4] }}>
      <div className="ms-hd"><span>Next belt</span><em>{short} {short === 1 ? 'point' : 'points'} short</em></div>
      <div className="ms-nm">{up[1]}</div>
      <div className="ms-bar"><i style={{ width: `${fill}%` }} /><b>{up[0]}</b></div>
    </div>
  );
}

// ─── THE GRADING ────────────────────────────────────────────────────────────
// DYE THE BELT (owner-approved mockup, 2026-10-17) plays first, as a curtain
// over the whole screen (app/dojo/DyeCurtain.jsx): each form paints the screen
// in its colour while its grid ripples in and its clock and points land, then
// the total climbs the belts, then the seal and the knot. It plays once, on the
// finish itself, never for reduced motion or a run restored already finished,
// and any tap or key skips it. Then the settled card below, unchanged.
function Grading({ sections, counted, parts, total, dateLabel, dateShort, animate, board, clocks, onShare, copied, onSettled }) {
  const n = sections.length;
  const pts = parts.map((p) => Math.round(p));
  const fti = dojoTierOf(total);
  const t = B[fti];
  const reduce = useMemo(() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }, []);
  const play = animate && !reduce;
  const [curtain, setCurtain] = useState(play);
  // The settled card is drawn exactly as it always was once graded.
  const lines = n, cur = total, face = fti, dye = false, upg = null, sparks = [];
  const phase = curtain ? 'grade' : 'settled';
  const runClockAll = counted.reduce((a, c) => a + ((c && c.secs) || 0), 0);
  // Every hook sits above the curtain's early return.
  useEffect(() => { if (!curtain && onSettled) onSettled(); }, [curtain]); // eslint-disable-line react-hooks/exhaustive-deps
  if (curtain) {
    return (
      <section className="gr">
        <DyeCurtain sections={sections} counted={counted} parts={parts} total={total} runClock={runClockAll}
          dateShort={dateShort} board={board} onDone={() => setCurtain(false)} />
      </section>
    );
  }

  const me = board && board.data && board.data.me;
  const field = board && board.data && Array.isArray(board.data.overall) ? (board.data.uniquePlayers || board.data.overall.length) : null;
  let hi = 0, lo = 0;
  pts.forEach((v, i) => { if (v / sections[i].weight > pts[hi] / sections[hi].weight) hi = i; if (v / sections[i].weight < pts[lo] / sections[lo].weight) lo = i; });
  const flat = pts[hi] / sections[hi].weight === pts[lo] / sections[lo].weight;
  const settled = phase === 'settled';
  const tied = phase === 'tie' || settled;
  const runClock = counted.reduce((a, c) => a + ((c && c.secs) || 0), 0);

  return (
    <section className="gr">
      <div className={`gr-stage${settled ? ' settled' : ''}${phase === 'seal' ? ' thud' : ''}`}>
        <div className="gr-left">
          {upg && <div key={upg.k} className="gr-upg">{upg.text}</div>}
          <div className={`gr-beltwrap${tied ? ' tied' : ''}`}>
            <Belt ti={face} tied={tied} dye={dye} />
            <div className="gr-beltnm" key={face}>{B[face][1]}</div>
          </div>
          {tied && <NextBelt total={total} ti={fti} />}
          {sparks.map((p) => <i key={p.id} className="gr-spark" style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--d': `${p.ms}ms` }} />)}
        </div>
        <div className="gr-right">
          <div className="sh" aria-hidden={!settled}>
            <div className="sh-hd"><span>Grading sheet</span><span>{sections.length} forms</span></div>
            <div className="sh-lines">
              {sections.slice(0, lines).map((s, i) => (
                <div key={s.key} className="sh-l">
                  <span className="sh-c">Form {i + 1}</span>
                  <span className="sh-n">{s.name}<small>{counted[i] && !counted[i].unknown ? `${dojoAcc(counted[i].score, counted[i].total) >= 1 ? 'Solved' : 'Unfinished'} in ${counted[i].secs ? fmtClock(counted[i].secs) : '?'}` : s.form}</small></span>
                  <b className={pts[i] >= s.weight - 1 ? 'top' : ''}>{pts[i]}<small>/{s.weight}</small></b>
                </div>
              ))}
            </div>
            <div className="sh-tot">
              <div><span>Run total</span><b>{cur}<small> / {DOJO_MAX}</small></b></div>
              <div className="r"><span>Time on the mat</span><b className="clk">{fmtClock(runClock)}</b></div>
            </div>
            {(phase === 'seal' || tied) && <div className={`sh-seal${tied ? ' set' : ''}`}><span>Promoted</span><small>{t[2]}</small></div>}
          </div>
        </div>
      </div>

      {settled && (
        <div className="gr-copy" role="status">
          {(() => {
            // THE RUN SCORECARD (owner, 2026-10-20): result, board and every
            // form in one table, the challenge and the next slot under it.
            const sf = board && board.data && board.data.stageField;
            const stages = sections.map((s, i) => ({ key: s.key, name: s.name, colour: rampFor(i) }));
            const mePer = Object.fromEntries(sections.map((s, i) => [s.key, counted[i] ? pts[i] : null]));
            const built = boardRows({ data: board && board.data, perOf: (x) => x.sv || null, titleOf: (v) => B[dojoTierOf(v)][1], mePer, meTotal: total, meTitle: t[1] });
            const ranks = {};
            sections.forEach((s, i) => { if (counted[i]) { const k = stageRank(sf, s.key, pts[i]); if (k) ranks[s.key] = k; } });
            const avg = stageAvg(sf, sections);
            const miss = Object.fromEntries(sections.map((s, i) => [s.key, !!(counted[i] && !counted[i].unknown && dojoAcc(counted[i].score, counted[i].total) < 1)]));
            const subBits = [];
            if (built.meRank) subBits.push(<b key="r">#{built.meRank}{built.field ? ` of ${Number(built.field).toLocaleString()}` : ''}</b>);
            if (built.ahead != null) subBits.push(`ahead of ${built.ahead}%`);
            if (runClock > 0) subBits.push(fmtClock(runClock));
            return (
              <RunScorecard
                stages={stages}
                rows={built.rows}
                you={{ miss }}
                avg={avg}
                ranks={Object.keys(ranks).length ? ranks : null}
                scale={Object.fromEntries(sections.map((s) => [s.key, s.weight]))}
                avgTotal={avg ? Math.round(sections.reduce((a, s) => a + (Number(avg[s.key]) || 0), 0)) : null}
                hero={{ value: total, of: DOJO_MAX, tone: '#a5b4fc', eyebrow: 'You tied on the', title: t[1], sub: subBits.length ? subBits.reduce((acc, x, i) => (i ? [...acc, ' \u00B7 ', x] : [x]), []) : null, line: t[5],
                  ladder: { kind: 'belts', label: 'The belts', value: total, steps: [...DOJO_BELTS].reverse().map((b) => ({ min: b[0], name: b[1], short: b[2], colour: b[3] })),
                    next: fti > 0 ? `${DOJO_BELTS[fti - 1][0] - total} more point${DOJO_BELTS[fti - 1][0] - total === 1 ? '' : 's'} and you tie on ${DOJO_BELTS[fti - 1][1].replace(' Belt', '')}.` : 'Black belt. Nothing above it.' } }}
                field={built.field}
                boardHref="/dojo/leaderboard"
                boardState={(board && board.state) || 'loading'}
                aside={<>
                  <RunChallengeLine gameKey={DOJO_RUN_ID} score={total} total={DOJO_MAX} n={runToken()} />
                  <RunChallengeButton gameKey={DOJO_RUN_ID} score={total} total={DOJO_MAX} n={runToken()} t={runClock > 0 ? Math.round(runClock) : null} status={t[1]} door />
                </>}
                next={<RunNextSlot circuitId={DOJO_RUN_ID} exclude={sections.map((s) => s.key)} cats={['Sudoku']} />}
              />
            );
          })()}
          <NextDrop label="Tomorrow's forms" sub="A new six by six, a new classic and a new variant at midnight Eastern." href="/dojo"
            accent="var(--dj-cta)" ink="var(--dj-ink)" mute="var(--dj-mute)" style={{ margin: '14px 0 0' }} />
          <MoreRunsList self="dojo" ink="var(--dj-ink)" mute="var(--dj-mute)" line="var(--dj-line)" onShare={onShare} copied={copied} />
          <div className="gr-lad"><div className="eb">The belts</div><Ladder at={fti} /></div>
        </div>
      )}
    </section>
  );
}

// ─── TODAY'S BOARD (owner, 2026-10-19) ─────────────────────────────────────
// The Gauntlets' end-card board, in the Dojo's own dress: today's top three
// plus your own row, each with the belt that total ties on and three bars, one
// per form, filled as a share of that form's points (so a full bar is full
// marks whatever the form is worth). Other players' bars are graded from their
// board rows with the same scorer and the same day's clocks the board itself
// ranks on; your own row uses the figures on the sheet above, so the two
// cannot disagree. It invents nothing: a row with no per-form data draws no bars.
function DojoBoard({ sections, parts, total, board, clocks }) {
  const data = board && board.data;
  const state = board && board.state;
  const rows = data && Array.isArray(data.overall) ? data.overall.filter((x) => Number.isFinite(Number(x.total))) : [];
  const me = data && data.me;
  const meKey = me && me.userKey ? me.userKey : null;
  const meRank = me && Number.isFinite(Number(me.rank)) ? Number(me.rank) : null;
  const fieldN = data ? Number(data.overallField || data.uniquePlayers || rows.length) || null : null;
  const ahead = meRank && fieldN && fieldN >= 2 ? Math.max(0, Math.round(((fieldN - meRank) / fieldN) * 100)) : null;
  const shareOf = (key, p) => {
    if (!p || p.abandoned) return 0;
    return dojoGridPoints(key, p.score, p.total, p.timeElapsed, clocks || DOJO_CLOCK);
  };
  const beltName = (pts) => B[dojoTierOf(pts)][1];
  const top = rows.slice(0, 3);
  const meInTop = !!(meKey && top.some((x) => x.userKey === meKey));
  const out = top.map((x, i) => {
    const mine = !!(meKey && x.userKey === meKey);
    const t = Math.round(Number(x.total) || 0);
    return {
      key: x.userKey || `r${i}`, rank: String(x.rank || i + 1), name: x.username || 'Player', total: mine ? total : t,
      sub: [beltName(mine ? total : t), mine && ahead != null ? `ahead of ${ahead}%` : ''].filter(Boolean).join(' · '),
      ti: dojoTierOf(mine ? total : t), me: mine, rc: ['#e8b43a', '#b8bcc4', '#c8814b'][i],
      per: mine ? parts : (x.perGame ? sections.map((s) => shareOf(s.key, x.perGame[s.key])) : null),
    };
  });
  if (me && !meInTop && meRank) {
    out.push({
      key: 'me', rank: String(meRank), name: me.username || 'You', total,
      sub: [beltName(total), ahead != null ? `ahead of ${ahead}%` : ''].filter(Boolean).join(' · '),
      ti: dojoTierOf(total), me: true, rc: 'var(--dj-cta)', per: parts,
    });
  }
  const names = sections.map((s) => s.name);
  const listed = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names.join('');
  return (
    <div className="db">
      <div className="db-hd">
        <span>Today&rsquo;s board{fieldN ? ` · ${Number(fieldN).toLocaleString()} ${fieldN === 1 ? 'player' : 'players'}` : ''}</span>
        <a href="/dojo/leaderboard">Full board</a>
      </div>
      {out.length ? (
        <div className="db-rows">
          {out.map((r, i) => (
            <div key={r.key} className={`db-row${r.me ? ' me' : ''}`} style={{ animationDelay: `${0.1 + i * 0.07}s` }}>
              <div className={`db-rk${r.rank.length >= 3 ? ' sm' : ''}`} style={{ color: r.me ? 'var(--dj-cta)' : r.rc }}>{r.rank}</div>
              <div className="db-who">
                <div className="db-nm">{r.name}</div>
                <div className="db-sub"><i style={{ background: B[r.ti][3] }} />{r.sub}</div>
              </div>
              {r.per ? (
                <div className="db-bars" aria-hidden="true">
                  {sections.map((s, k) => {
                    const v = Math.max(0, Number(r.per[k]) || 0);
                    const pct = s.weight ? Math.min(100, Math.round((v / s.weight) * 100)) : 0;
                    return <div key={s.key} style={{ height: `${Math.max(pct, 4)}%`, background: `var(--dj-${s.key})`, opacity: v > 0 ? 1 : 0.25 }} />;
                  })}
                </div>
              ) : <div />}
              <div className="db-tot">{r.total}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="db-empty">{state === 'error' ? 'The board could not be loaded just now.' : state === 'ready' ? 'Nobody on the board yet.' : 'Reading the board.'}</div>
      )}
      {out.length ? <div className="db-ft">Bars: share of the points on {listed}.</div> : null}
    </div>
  );
}

const CSS = `
.dj *{box-sizing:border-box}
.dj .eb{font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--dj-mute)}
.dj-cap{display:flex;align-items:center;gap:12px;max-width:none;margin:0;padding:12px 20px;font-size:13px}
.dj-home{font-family:${MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--dj-mute);text-decoration:none}
.dj-cap b{font-weight:900;letter-spacing:-.01em}
.dj-capd{color:var(--dj-mute);font-weight:700}
.dj-capt{display:flex;gap:4px;margin-left:auto}
.dj-capt i{width:22px;height:6px;border-radius:3px;background:var(--dj-line)}
.dj-capt i.on{box-shadow:0 0 0 2px var(--dj-ground),0 0 0 3px var(--dj-ink)}
.dj-lb{margin-left:auto;font-family:${MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--dj-cta);text-decoration:none}
/* PREGAME */
.pre{max-width:860px;margin:0 auto;padding:18px 16px 54px;text-align:center}
.title{margin:10px 0 0;font-size:clamp(44px,8.5vw,78px);font-weight:900;letter-spacing:-.035em;line-height:.98;font-family:${SERIF};font-style:italic;display:flex;flex-wrap:wrap;justify-content:center;gap:0 .26em}
.title span{display:inline-block;animation:djdrop .7s cubic-bezier(.2,1.4,.4,1) both}
@keyframes djdrop{from{transform:translateY(-40px);opacity:0}to{transform:none;opacity:1}}
.lede{margin:14px auto 0;max-width:580px;font-size:15.5px;font-weight:600;line-height:1.5;color:var(--dj-mute)}
.lede b{color:var(--dj-ink)}
.lede-x{display:block;margin-top:4px;color:var(--dj-gold);font-weight:800}
.door{display:block;width:100%;max-width:440px;margin:20px auto 0;padding:0;border:1.5px solid var(--dj-line);border-radius:16px;background:var(--dj-panel);color:var(--dj-ink);box-shadow:0 14px 34px rgba(0,0,0,.55);overflow:hidden;cursor:pointer;font:inherit}
.door-frame{position:relative;display:block;height:132px;margin:12px 12px 10px;border-radius:6px;background:var(--dj-wood);overflow:hidden;box-shadow:inset 0 0 0 5px #24160d}
.door-light{position:absolute;inset:5px;background:radial-gradient(ellipse at 50% 60%,#fff6dc 0%,#f2d38a 38%,#a3702f 100%);opacity:.9}
.door-p{position:absolute;top:5px;bottom:5px;width:calc(50% - 5px);background-color:#efe6d0;background-image:linear-gradient(90deg,transparent 31%,#4a2f1b 31%,#4a2f1b 35%,transparent 35%,transparent 64%,#4a2f1b 64%,#4a2f1b 68%,transparent 68%),linear-gradient(0deg,transparent 23%,#4a2f1b 23%,#4a2f1b 26%,transparent 26%,transparent 48%,#4a2f1b 48%,#4a2f1b 51%,transparent 51%,transparent 73%,#4a2f1b 73%,#4a2f1b 76%,transparent 76%);box-shadow:inset 0 0 0 4px #4a2f1b;transition:transform .85s cubic-bezier(.65,0,.35,1)}
.door-p.l{left:5px}.door-p.r{right:5px}
.door-p i{position:absolute;top:50%;width:6px;height:26px;margin-top:-13px;border-radius:3px;background:#2a1a0f}
.door-p.l i{right:10px}.door-p.r i{left:10px}
.door:hover .door-p.l{transform:translateX(-6px)}.door:hover .door-p.r{transform:translateX(6px)}
.door.open .door-p.l{transform:translateX(-102%)}.door.open .door-p.r{transform:translateX(102%)}
.door-sign{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);font:600 9.5px ${MONO};letter-spacing:.16em;text-transform:uppercase;color:#f6efdc;background:rgba(36,22,13,.82);padding:3px 8px;border-radius:4px;white-space:nowrap;z-index:2}
.door-go{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px;padding:15px 18px;background:var(--dj-cta);color:var(--dj-cta-ink);font:900 19px ${SANS}}
.door-go::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transform:translateX(-100%);animation:djsheen 2.6s 1.4s ease-in-out infinite}
@keyframes djsheen{to{transform:translateX(100%)}}
.door:focus-visible,.pre-how:focus-visible{outline:2px solid var(--dj-ink);outline-offset:3px}
.wall{display:flex;justify-content:center;gap:18px;max-width:640px;margin:30px auto 0;padding:22px 14px 20px;border-radius:18px;background:linear-gradient(180deg,#2a1b10,#1a110a);box-shadow:inset 0 2px 0 rgba(255,255,255,.06),0 18px 40px rgba(0,0,0,.5)}
.scroll{flex:1;max-width:170px;position:relative;display:flex;flex-direction:column;align-items:stretch;transform-origin:50% 0;animation:djunroll .7s cubic-bezier(.2,1.1,.4,1) both}
@keyframes djunroll{from{opacity:0;transform:scaleY(.15)}to{opacity:1;transform:none}}
.rod{display:block;height:8px;margin:0 -6px;border-radius:4px;background:linear-gradient(180deg,#6b4220,#3b2412);box-shadow:0 2px 4px rgba(0,0,0,.4)}
.sc-body{background:var(--dj-paper);color:#2b2216;padding:14px 10px 14px;text-align:center;border-left:4px solid var(--c);border-right:4px solid var(--c);min-height:170px;display:flex;flex-direction:column;align-items:center}
.sc-k{font:800 9.5px ${MONO};letter-spacing:.16em;text-transform:uppercase;color:#8a7553}
.sc-n{font:700 24px/1.1 ${SERIF};margin-top:8px}
.sc-f{font:800 11px ${SANS};letter-spacing:.06em;text-transform:uppercase;color:#5a4a33;margin-top:4px}
.sc-c{font:600 11.5px/1.3 ${SANS};color:#6c5a40;margin-top:7px}
.sc-w{margin-top:auto;padding-top:10px;font:800 10px ${MONO};letter-spacing:.12em;text-transform:uppercase;color:var(--dj-seal)}
.sc-bk{margin-top:auto;padding-top:10px;font-size:10.5px;font-weight:800;color:#2f5d3a}
.pre-row{display:flex;flex-direction:row-reverse;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;max-width:640px;margin:16px auto 0}
.pre-row .sub2{margin:0;text-align:right;max-width:280px}
.pre-how{background:none;border:0;padding:6px 0;color:var(--dj-gold);font:800 13px ${SANS};text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.sub2{margin-top:12px;font-size:12.5px;font-weight:700;color:var(--dj-mute)}
.sub2 a{color:var(--dj-ink)}
.pre-lad{max-width:560px;margin:10px auto 0;animation:djrise .3s ease both}
.facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0 14px}
.fact{background:var(--dj-panel);border:1.5px solid var(--dj-line);border-radius:12px;padding:9px 10px;text-align:left}
.fact b{display:block;font-size:20px;font-weight:900}
.fact span{font-size:11px;font-weight:700;color:var(--dj-mute);line-height:1.25;display:block}
.pre.leave .scroll{animation:djroll .55s cubic-bezier(.6,0,.8,.4) both !important}
.pre.leave .scroll:nth-child(2){animation-delay:.06s !important}.pre.leave .scroll:nth-child(3){animation-delay:.12s !important}
@keyframes djroll{to{transform:scaleY(.1);opacity:0}}
.pre.leave .fade:not(.door){transition:opacity .4s .3s;opacity:0}
/* THE BELT */
.bt{position:relative;width:280px;height:120px;--bw:28px}
.bt-band{position:absolute;left:0;right:0;top:20px;height:var(--bw);border-radius:4px;background:var(--b);box-shadow:inset 0 3px 0 rgba(255,255,255,.18),inset 0 -3px 0 rgba(0,0,0,.25),0 10px 20px -8px rgba(0,0,0,.7);background-image:repeating-linear-gradient(0deg,transparent 0 5px,rgba(0,0,0,.12) 5px 6px);transition:background-color .25s}
.bt-knot{position:absolute;left:50%;top:13px;width:40px;height:42px;margin-left:-20px;border-radius:7px;background:var(--b);box-shadow:inset 0 3px 0 rgba(255,255,255,.2),inset 0 -4px 0 rgba(0,0,0,.3),0 6px 14px rgba(0,0,0,.5);transform:scale(0);transition:transform .45s cubic-bezier(.2,1.6,.4,1) .1s,background-color .25s}
.bt-tail{position:absolute;top:42px;width:var(--bw);height:0;border-radius:0 0 4px 4px;background:var(--b);box-shadow:inset 0 -3px 0 rgba(0,0,0,.25);transition:height .55s cubic-bezier(.3,1.3,.5,1) .35s,background-color .25s;overflow:hidden}
.bt-tail.l{left:50%;margin-left:-30px;transform-origin:50% 0;transform:rotate(14deg)}
.bt-tail.r{left:50%;margin-left:2px;transform-origin:50% 0;transform:rotate(-14deg)}
.bt-tail b{position:absolute;left:0;right:0;bottom:8px;height:14px;background:var(--st);box-shadow:0 0 0 1px rgba(0,0,0,.2)}
.bt.tied .bt-knot{transform:scale(1)}
.bt.tied .bt-tail{height:68px}
.bt.dye .bt-band{animation:djdye .26s ease-out}
@keyframes djdye{0%{filter:brightness(1.8)}100%{filter:none}}
.bt.white .bt-band,.bt.white .bt-knot,.bt.white .bt-tail{box-shadow:0 0 0 1px rgba(0,0,0,.25),inset 0 -3px 0 rgba(0,0,0,.12)}
.bt.sm{width:150px;height:70px;--bw:16px}
/* PLAY */
.dj-play{max-width:1180px;margin:0 auto;padding:4px 0 50px}
.dj-sechd{display:flex;align-items:center;gap:10px;max-width:760px;margin:6px auto 0;padding:0 16px;animation:djrise .4s ease both}
.dj-sectag{font:800 11px ${SANS};letter-spacing:.06em;text-transform:uppercase;color:#0b0f1a;background:var(--c);padding:5px 10px;border-radius:5px}
.dj-sechd b{font-size:20px;font-weight:900;letter-spacing:-.01em}
.dj-run{margin-left:auto;font-family:${MONO};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--dj-mute)}
.dj-host{animation:djrise .45s ease both}
.dj-host .stage-page{min-height:0 !important;background:transparent !important;overflow-x:visible !important}
.dj-host.lt{background:#eef1f6;border-radius:16px;margin:12px 12px 0;padding:6px 0 18px}
.dj-host.lt .stage-page{color:var(--stg-ink) !important}
@media(max-width:760px){.dj-host.lt{margin:10px 0 0;border-radius:0}}
.dj-tg{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font:800 11px ${SANS};letter-spacing:.05em;text-transform:uppercase;color:var(--dj-ink);background:var(--dj-surf);border:1px solid var(--dj-line);border-radius:999px;padding:6px 11px;cursor:pointer}
.dj-tg:hover{border-color:var(--dj-mute)}
.dj-tg span{font-size:13px;line-height:1}
.dj-tg + .dj-tg{margin-left:0}
@media(max-width:600px){.dj-sechd{flex-wrap:wrap;row-gap:6px}}
.dj-tg + .dj-run{margin-left:10px}
/* A light board inside the Dojo must not repaint the page behind it: the
   globals.css :has() rule paints html and body light for any light stage page. */
html:not(.dj-x):has(.stage-page.dj[data-stage-theme]),html:not(.dj-x) body:has(.stage-page.dj[data-stage-theme]){background:#0b0f1a !important}
.dj-between{text-align:center;padding:30px 16px;max-width:560px;margin:0 auto;animation:djrise .4s ease both}
.dj-bscore{font-size:68px;font-weight:900;letter-spacing:-.04em;margin-top:6px}
.dj-bscore small{font-size:24px;color:var(--dj-mute)}
.dj-braw{color:var(--dj-mute);font-weight:700}
.dj-split{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:420px;margin:12px auto 0;text-align:left}
.dj-split div{position:relative;background:var(--dj-surf);border:1px solid var(--dj-line);border-radius:12px;padding:10px 12px 14px;overflow:hidden}
.dj-split span{display:block;font:800 9.5px ${SANS};letter-spacing:.14em;text-transform:uppercase;color:var(--dj-mute)}
.dj-split b{font:500 22px ${MONO}}
.dj-split small{display:block;font-size:10.5px;font-weight:700;color:var(--dj-mute);margin-top:2px}
.dj-split i{position:absolute;left:0;bottom:0;height:4px;background:var(--dj-gold);border-radius:0 2px 2px 0}
.dj .start{margin:26px auto 0;display:inline-flex;align-items:center;gap:10px;font:900 18px ${SANS};border:0;border-radius:14px;padding:15px 28px;background:var(--dj-cta);color:var(--dj-cta-ink);cursor:pointer;box-shadow:0 14px 34px rgba(0,0,0,.55)}
.dj .start:active{transform:scale(.97)}
.dj-rolling{margin:26px auto 0;display:inline-flex;align-items:center;gap:10px;font:800 15px ${SANS};color:var(--dj-gold)}
.dj-dots{display:inline-flex;gap:5px}
.dj-dots i{width:6px;height:6px;border-radius:50%;background:var(--dj-gold);animation:djdot 1s ease-in-out infinite}
.dj-dots i:nth-child(2){animation-delay:.15s}.dj-dots i:nth-child(3){animation-delay:.3s}
@keyframes djdot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
@keyframes djrise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
/* LADDER */
.lad{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;text-align:left}
.lad li{display:flex;align-items:center;gap:12px;padding:7px 10px;border-radius:10px;background:var(--dj-surf);border:1px solid var(--dj-line)}
.lad li.me{border-color:var(--dj-gold);box-shadow:0 0 0 1px var(--dj-gold) inset,inset 5px 0 0 var(--dj-gold);background:rgba(233,207,127,.08)}
.lad .lp{flex:none;position:relative;width:34px;height:12px;border-radius:3px;background:var(--b);box-shadow:0 0 0 1px rgba(255,255,255,.22)}
.lad .lp i{position:absolute;right:5px;top:0;bottom:0;width:6px;background:var(--st)}
.lad .ln{flex:1;min-width:0;display:flex;flex-direction:column}
.lad .ln b{font-size:13.5px;font-weight:800;line-height:1.25}
.lad .ln small{font-size:11px;color:var(--dj-mute);font-weight:700;line-height:1.3}
.lad .lc{font:500 12px ${MONO};color:var(--dj-gold);white-space:nowrap}
/* GRADING */
.gr{position:relative;max-width:980px;margin:0 auto;padding:14px 16px 70px}
.gr > .eb{text-align:center}
.gr-stage{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:34px;align-items:center;margin-top:22px;min-height:400px}
.gr-stage.thud{animation:djshake .45s ease-out}
@keyframes djshake{15%{transform:translate(3px,2px)}30%{transform:translate(-3px,-1px)}45%{transform:translate(2px,-2px)}60%{transform:translate(-1px,1px)}}
.gr-left{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:260px}
.gr-beltwrap{display:flex;flex-direction:column;align-items:center;padding:22px 20px 14px;border-radius:16px;background:radial-gradient(ellipse at 50% 30%,rgba(255,255,255,.07),transparent 70%)}
.gr-beltnm{margin-top:6px;font:700 26px/1.1 ${SERIF};animation:djrise .3s ease both}
.gr-upg{position:absolute;left:50%;top:-6px;font:800 11px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:var(--dj-cta-ink);background:var(--dj-cta);padding:6px 11px;border-radius:999px;white-space:nowrap;z-index:4;animation:djup 1s ease-out both}
@keyframes djup{0%{opacity:0;transform:translate(-50%,12px)}20%{opacity:1;transform:translate(-50%,0)}75%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-8px)}}
.gr-spark{position:absolute;left:50%;top:40%;width:6px;height:6px;margin:-3px;border-radius:50%;background:var(--dj-gold);z-index:5;pointer-events:none;animation:djspark var(--d) cubic-bezier(.2,.7,.3,1) both}
@keyframes djspark{from{transform:translate(0,0) scale(1);opacity:1}to{transform:translate(var(--x),var(--y)) scale(.2);opacity:0}}
.ms{width:min(320px,92%);margin-top:14px;padding:11px 13px 12px;border-radius:10px;background:var(--dj-surf);border:1px solid var(--dj-line);text-align:left;animation:djrise .5s .5s ease both}
.ms-hd{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.ms-hd span{font:800 10px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:var(--dj-mute)}
.ms-hd em{font:normal 500 12px ${MONO};color:var(--dj-gold)}
.ms-nm{margin-top:4px;font:700 16px/1.2 ${SERIF}}
.ms-bar{position:relative;margin-top:9px;height:8px;border-radius:4px;background:rgba(255,255,255,.08)}
.ms-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:var(--b);box-shadow:0 0 0 1px rgba(255,255,255,.18) inset;animation:djfill 1.1s .7s cubic-bezier(.2,.8,.3,1) both;transform-origin:0 50%}
.ms-bar b{position:absolute;right:-2px;top:-17px;font:500 10px ${MONO};color:var(--dj-mute)}
@keyframes djfill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.ms.top b{display:block;margin-top:4px;font:700 16px ${SERIF}}
.ms.top span{font:800 10px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:var(--dj-gold)}
.gr-right{position:relative;display:flex;justify-content:center;align-items:center;min-height:340px}
.sh{position:relative;width:min(440px,100%);background:var(--dj-paper);color:#1f2430;border-radius:6px;padding:18px 20px 16px;box-shadow:0 30px 60px -25px rgba(0,0,0,.8);overflow:hidden}
.sh::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 27px,rgba(31,36,48,.06) 27px 28px);pointer-events:none}
.sh-hd{display:flex;justify-content:space-between;font:800 10px ${MONO};letter-spacing:.14em;text-transform:uppercase;color:#7a7360;border-bottom:2px solid #1f2430;padding-bottom:8px;margin-bottom:6px}
.sh-lines{min-height:150px}
.sh-l{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(31,36,48,.2);animation:djrise .3s ease both}
.sh-c{font:500 11px ${MONO};color:#7a7360;width:52px}
.sh-n{flex:1;font-weight:900;font-size:16px;display:flex;flex-direction:column}
.sh-n small{font:600 11px ${SANS};color:#7a7360}
.sh-l b{font:500 22px ${MONO}}
.sh-l b small{font-size:12px;color:#7a7360}
.sh-l b.top{color:#2f6f3a}
.sh-tot{display:flex;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:2px solid #1f2430}
.sh-tot span{display:block;font:800 9.5px ${SANS};letter-spacing:.14em;text-transform:uppercase;color:#7a7360}
.sh-tot b{font:500 30px ${MONO};font-variant-numeric:tabular-nums}
.sh-tot b small{font-size:14px;color:#7a7360}
.sh-tot b.clk{font-size:22px}
.sh-tot .r{text-align:right}
.sh-seal{position:absolute;left:50%;bottom:8px;margin-left:-66px;width:132px;height:78px;padding:0 8px;box-sizing:border-box;border:4px solid var(--dj-seal);border-radius:12px;color:var(--dj-seal);display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-10deg);mix-blend-mode:multiply;animation:djseal .45s cubic-bezier(.2,1.6,.4,1) both;background:rgba(180,35,42,.06)}
.sh-seal span{font:900 15px ${SANS};letter-spacing:.1em;text-transform:uppercase;white-space:nowrap;line-height:1}
.sh-seal small{font:800 10px ${MONO};letter-spacing:.16em;margin-top:4px}
.sh-seal.set{animation:none;opacity:.85}
@keyframes djseal{from{opacity:0;transform:rotate(-10deg) scale(2.6)}to{opacity:.88;transform:rotate(-10deg) scale(1)}}
.gr-copy{margin:8px 0 0;animation:djrise .6s .1s ease both}
.gr-you{font:800 12px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:var(--dj-gold)}
.gr-nm{font-size:clamp(32px,5vw,48px);font-weight:900;letter-spacing:-.02em;line-height:1.05;margin:8px 0 10px}
.gr-ln{font-size:17px;line-height:1.45;margin:0 0 16px;color:var(--dj-ink)}
.gr-stats{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:8px;margin-bottom:10px}
.gr-stats div{background:var(--dj-surf);border:1px solid var(--dj-line);border-radius:12px;padding:9px 11px;display:flex;flex-direction:column;gap:3px;min-width:0}
.gr-stats b{font:500 20px ${MONO};white-space:nowrap}
.gr-lbl{position:relative;display:flex;flex-direction:column;gap:3px;min-width:0;padding:9px 30px 9px 11px;border-radius:12px;background:var(--dj-surf);border:1px solid var(--dj-cta);color:inherit;text-decoration:none}
.gr-lbl b{font:500 20px ${MONO};white-space:nowrap}
.gr-lbl span{font:800 9.5px ${SANS};letter-spacing:.12em;text-transform:uppercase;color:var(--dj-mute)}
.gr-lbl em{position:absolute;right:10px;top:50%;transform:translateY(-50%);font-style:normal;font-weight:800;font-size:16px;color:var(--dj-cta)}
.gr-stats span{font:800 9.5px ${SANS};letter-spacing:.12em;text-transform:uppercase;color:var(--dj-mute)}
.gr-games{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.gr-games div{background:var(--dj-surf);border:1px solid var(--dj-line);border-radius:9px;padding:8px 4px;text-align:center;min-width:0}
.gr-games i{display:block;font:normal 800 9px ${SANS};letter-spacing:.06em;text-transform:uppercase;color:var(--dj-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gr-games b{font:500 18px ${MONO}}
.gr-games b small{font-size:11px;color:var(--dj-mute)}
.gr-games .hi{border-color:var(--dj-gold)}.gr-games .hi b{color:var(--dj-gold)}
.gr-games .lo b{color:var(--dj-bad)}
.db{margin:16px 0 0}
.db-hd{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:8px}
.db-hd span{font:800 11px ${SANS};letter-spacing:.14em;text-transform:uppercase;color:var(--dj-mute)}
.db-hd a{font:800 12.5px ${SANS};color:var(--dj-cta);text-decoration:none}
.db-hd a:hover{text-decoration:underline}
.db-rows{display:flex;flex-direction:column;gap:7px}
.db-row{display:grid;grid-template-columns:34px minmax(0,1fr) minmax(54px,96px) 44px;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:var(--dj-surf);border:1px solid var(--dj-line);animation:djrise .45s ease both}
.db-row.me{border-color:var(--dj-cta);background:rgba(125,211,252,.08);box-shadow:inset 0 0 0 1px var(--dj-cta),inset 5px 0 0 var(--dj-cta)}
.db-rk{font:800 17px ${SANS};font-variant-numeric:tabular-nums}
.db-rk.sm{font-size:14px}
.db-who{min-width:0}
.db-nm{font:800 15px ${SANS};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.db-sub{display:flex;align-items:center;gap:6px;margin-top:2px;font:700 12px ${SANS};color:var(--dj-mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.db-sub i{flex:none;width:14px;height:6px;border-radius:2px;box-shadow:0 0 0 1px rgba(255,255,255,.25)}
.db-bars{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;align-items:end;gap:3px;height:26px}
.db-bars div{border-radius:3px 3px 0 0}
.db-tot{font:800 21px ${SANS};text-align:right;font-variant-numeric:tabular-nums}
.db-empty{font:700 13px ${SANS};color:var(--dj-mute);padding:10px 0}
.db-ft{margin-top:8px;font:600 12px ${SANS};color:var(--dj-mute)}
@media(max-width:560px){.db-row{grid-template-columns:28px minmax(0,1fr) 54px 36px;gap:8px;padding:8px 10px}.db-tot{font-size:18px}.db-bars{height:22px;gap:2px}}
.gr-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.gr-btns a,.gr-btns button{font:800 14px ${SANS};padding:12px 18px;border-radius:12px;text-decoration:none;color:var(--dj-ink);border:1px solid var(--dj-line);background:transparent;cursor:pointer}
.gr-btns .pri{background:var(--dj-cta);color:var(--dj-cta-ink);border-color:transparent}
.gr-lad{margin-top:26px}
.gr-lad .eb{margin-bottom:8px}
@media(max-width:720px){
.gr-stage{display:flex;flex-direction:column;gap:16px;min-height:0}
.gr-left{min-height:0;padding-top:16px;width:100%}
.ms{width:100%;max-width:420px}
.gr-right{min-height:0;width:100%}
.gr-btns a,.gr-btns button{flex:1 1 40%;text-align:center;padding:12px 10px}
.sh-seal{width:112px;height:66px;margin-left:-56px;bottom:10px}
.sh-seal span{font-size:13px;letter-spacing:.06em}
}
@media(max-width:600px){.wall{gap:8px;padding:18px 8px 14px}.sc-body{padding:10px 5px;min-height:140px}.sc-n{font-size:17px}.sc-c{display:none}.sc-f{font-size:9.5px}.sc-k{font-size:8px;letter-spacing:.08em}.sc-bkx{display:none}.title{font-size:44px}.lede{font-size:14px}.pre-row .sub2{font-size:11.5px;max-width:200px}.facts{gap:5px}.fact{padding:7px}.fact b{font-size:16px}.fact span{font-size:9.5px}.dj-sechd b{font-size:16px}.door-frame{height:110px}.bt{width:240px}}
@media(prefers-reduced-motion:reduce){.dj *{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition:none !important}}
@media(max-width:899px){
html[data-stage-pastel] .dj{--dj-ground:#c9d2fd !important;--dj-panel:#d9e0fe !important;--dj-surf:rgba(8,34,46,.07) !important;--dj-line:rgba(8,34,46,.2) !important;--dj-ink:#08222e !important;--dj-mute:#23404f !important;--dj-cta:#08222e !important;--dj-cta-ink:#c9d2fd !important;--dj-gold:#7c4a03 !important;--dj-good:#065f46 !important;--dj-bad:#9f1239 !important}
html[data-stage-pastel] .dj-host.lt{background:transparent}
}
.pd{position:relative;flex:1 1 auto;width:100%;min-height:160px;border:2px solid #08222e;border-radius:18px;overflow:hidden;background:#3a2416;padding:0;cursor:pointer;display:block}
.pd-f{position:absolute;inset:10px;border-radius:8px;overflow:hidden;background:radial-gradient(ellipse at 50% 55%,#fff6dc 0%,#f2d38a 40%,#a3702f 100%)}
.pd-p{position:absolute;top:0;bottom:0;width:50%;background:#efe6d0;box-shadow:inset 0 0 0 4px #4a2f1b;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:4px;box-sizing:border-box;transition:transform .85s cubic-bezier(.65,0,.35,1)}
.pd-p.l{left:0}.pd-p.r{right:0}
.pd-p span{border:1.5px solid #4a2f1b;display:flex;align-items:center;justify-content:center;font:800 22px ${SANS};color:#4a2f1b}
.pd-p i{position:absolute;top:50%;width:6px;height:30px;margin-top:-15px;border-radius:3px;background:#2a1a0f}
.pd-p.l i{right:10px}.pd-p.r i{left:10px}
.pd.open .pd-p.l{transform:translateX(-100%)}.pd.open .pd-p.r{transform:translateX(100%)}
.pd-sign{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);font:800 10px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:#f6efdc;background:rgba(36,22,13,.85);padding:4px 9px;border-radius:5px;white-space:nowrap;z-index:2}
@media(prefers-reduced-motion:reduce){.pd-p{transition:none}}
.dj-look{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:18px;border:2px solid var(--dj-ink);background:transparent;color:var(--dj-ink);cursor:pointer;padding:0;margin-left:auto}
`;
