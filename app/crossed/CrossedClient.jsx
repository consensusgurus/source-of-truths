'use client';

// CROSSED: four crosswords as one run (owner, 2026-10-20).
//
// Emcee, Encore, Arcos, then Glyph (lib/crossed.js), back to back on one page,
// then a rank: the run total decides which day's newspaper crossword you are
// ready for, Monday up to Saturday, and at the top "Solves in Pen". It is the
// Dojo's machinery (app/dojo/DojoClient.jsx) with a crossword roster, and
// speed is most of the score.
//
// EACH PUZZLE IS THE REAL GAME, mounted inside app/RunEmbed.jsx. The start
// gate, the save, the hint and the /api/quiz/result row are exactly what that
// game does on its own page, so the run leaves exactly what four separate
// plays would, and the circuit board (scorer 'crossed') adds those rows up
// with the same scorer used here. A puzzle already finished today on its own
// page is not replayed: its first result stands.
//
// THE ENDING is the Dojo's: a curtain (app/crossed/CrossedCurtain.jsx) paints
// each puzzle in its colour while its clock and points land, then the total
// climbs the week, Monday to In Pen, then the settled card.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readStageTheme } from '@/lib/stage-theme';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import RunEmbed from '../RunEmbed';
import NextDrop from '../NextDrop';
import { RunChallengeButton, RunChallengeLine, RunChallengeCapture, runToken } from '../RunChallenge';
import MoreRunsPop, { MoreRunsList } from '../circuits/MoreRuns';
import useCircuitBoard from '../circuits/useCircuitBoard';
import { withRef } from '@/lib/referrals';
import { isMobileDevice } from '@/lib/is-mobile';
import { CROSSED_RUN_ID, CROSSED_BELTS, CROSSED_CLOCK, CROSSED_MAX, crossedTierOf, crossedGridPoints, crossedAcc, crossedSpeed, crossedDayTag, crossedInkOn } from '@/lib/crossed';
import RunBackLink from '../circuits/RunBackLink';
import CrossedCurtain, { gridOf } from './CrossedCurtain';
import Week, { WEEK_CSS } from './Week';

const CLIENTS = {
  emcee: dynamic(() => import('../emcee/EmceeClient'), { ssr: false, loading: () => null }),
  encore: dynamic(() => import('../encore/EncoreClient'), { ssr: false, loading: () => null }),
  arcos: dynamic(() => import('../arcos/ArcosClient'), { ssr: false, loading: () => null }),
  glyph: dynamic(() => import('../glyph/GlyphClient'), { ssr: false, loading: () => null }),
};

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const SERIF = "'Newsreader', Georgia, 'Times New Roman', serif";
const B = CROSSED_BELTS;
const LOW = B.length - 1;
const NUMS = ['One', 'Two', 'Three', 'Four', 'Five'];

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

// A puzzle's shape, small, for its clipping: black squares and white ones, no
// letters, so it spoils nothing (the curtain's own gridOf, read with no result).
function Shape({ sec }) {
  const { w, h, cells } = useMemo(() => gridOf(sec, null), [sec]);
  return (
    <div className="cl-g" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${w}, 1fr)`, aspectRatio: `${w} / ${h}` }}>
      {cells.flat().map((v, i) => <i key={i} className={v === '#' ? 'b' : ''} />)}
    </div>
  );
}

// THE START BUTTON is an across entry: 1 Across, (7, 2), and CROSSED UP types
// itself into the squares in pencil. Pressing it inks the letters in pen.
const ENTRY = 'CROSSED#UP';

export default function CrossedClient({ dateLabel, dateShort, sections = [], clocks: clocksIn = null }) {
  // The day's clocks come from the server (lib/crossed-clocks.js); the seed covers a
  // page served before they could be measured.
  const CLK = clocksIn || CROSSED_CLOCK;
  const N = sections.length;
  const STORE = `sot_run_crossed_${etToday()}`;
  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [leaving, setLeaving] = useState(false);
  const [ladderOpen, setLadderOpen] = useState(false);
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
    try { const v = JSON.parse(window.localStorage.getItem('sot_crossed_board2') || 'null'); if (v && v.day === etToday() && (v.t === 'light' || v.t === 'dark')) t = v.t; } catch (e) {}
    setBoardTheme(t);
  }, []);
  const flipBoard = () => setBoardTheme((cur) => { const next = cur === 'light' ? 'dark' : 'light'; try { window.localStorage.setItem('sot_crossed_board2', JSON.stringify({ t: next, day: etToday() })); } catch (e) {} return next; });
  const doneAtLoad = useRef(null);
  const [settled, setSettled] = useState(false);

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
  const parts = counted.map((c, i) => (c ? crossedGridPoints(sections[i].key, c.score, c.total, c.secs, CLK) : 0));
  const total = Math.round(parts.reduce((a, b) => a + b, 0));
  const allBanked = N > 0 && sections.every((s) => banked[s.key]);

  function start() {
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      const cur = rRef.current;
      if (allBanked) { commit({ ...cur, phase: 'done', t0: cur.t0 || Date.now(), tEnd: Date.now() }); return; }
      commit({ ...cur, phase: 'playing', si: 0, t0: cur.t0 || Date.now() });
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    }, 980);
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

  const tier = crossedTierOf(total);
  const belt = B[tier];

  function shareText() {
    const per = sections.map((s, i) => `${s.name} ${counted[i] ? Math.round(parts[i]) : '-'}`).join(' · ');
    const code = sections.length === 4 ? sections.map((s, i) => Math.round(parts[i])).join('-') : '';
    const link = `mindloftdaily.com/crossed${code ? `?s=${code}&t=${total}&d=${etToday()}` : ''}`;
    return `Crossed Up · ${dateShort} · ${total}/${CROSSED_MAX}\n${belt[1]}.${tier > 0 ? `\nNext up: ${B[tier - 1][1]}, ${Math.max(1, B[tier - 1][0] - total)} short.` : ''}\n${per}\n${withRef(link)}`;
  }
  function copyShare() {
    const text = done ? shareText() : `Crossed Up: four crosswords in one sitting, and speed is most of the score. Rank from Monday solver up to Solves in Pen.\n${withRef('mindloftdaily.com/crossed')}`;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const VARS = { '--dj-ground': '#0b0f1a', '--dj-panel': '#0d1220', '--dj-surf': 'rgba(255,255,255,.045)', '--dj-line': 'rgba(255,255,255,.12)', '--dj-ink': '#e9edf4', '--dj-mute': '#9aa8c4', '--dj-cta': '#7dd3fc', '--dj-cta-ink': '#08222e', '--dj-gold': '#e9cf7f', '--dj-good': '#6ee7b7', '--dj-bad': '#fb7185', '--dj-paper': '#f6f1e4', '--dj-wood': '#3a2416', '--dj-seal': '#b4232a' };
  sections.forEach((s) => { VARS[`--dj-${s.key}`] = s.color; });
  const runSoFar = sections.slice(0, r.si).reduce((a, s, i) => a + (counted[i] ? parts[i] : 0), 0);
  const Game = sec ? CLIENTS[sec.key] : null;
  
  return (
    <div className="stage-page dj" data-stage-theme="dark" style={{ ...VARS, minHeight: '100vh', background: 'var(--dj-ground)', color: 'var(--dj-ink)', fontFamily: SANS, overflowX: 'hidden', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={`dj-cap${done ? ' vf' : ''}`}>
        {done && <RunBackLink />}
        <Link href="/" className="dj-home">Mind Loft</Link>
        <b>Crossed Up</b>
        <span className="dj-capd">{dateShort}</span>
        {playing && <span className="dj-capt">{sections.map((s, i) => <i key={s.key} className={i < r.si ? 'd' : i === r.si ? 'on' : ''} style={{ background: i <= r.si ? `var(--dj-${s.key})` : undefined }} title={s.name} />)}</span>}
        {!playing && <a className="dj-lb" href="/crossed/leaderboard">Leaderboard</a>}
      </div>

      {hydrated && r.phase === 'idle' && (
        <section className={`pre${leaving ? ' leave' : ''}`}>
          <h1 className="title fade">{'Crossed Up'.split(' ').map((w, i) => <span key={i} style={{ animationDelay: `${i * 0.09}s` }}>{w}</span>)}</h1>
          <p className="lede fade">Four crosswords in one sitting: <b>the mini</b>, <b>the big nine by nine</b>, <b>three acrostics</b>, then <b>a grid with no clues</b>. Finishing counts a fifth, <b>speed</b> counts the rest. <span className="lede-x">Your score says which day of the week you solve like.</span></p>

          <button type="button" className={`xw fade${leaving ? ' go' : ''}`} onClick={start} aria-label={allBanked ? 'See your rank' : 'Pick up the pencil'}>
            <span className="xw-clue"><b>1 Across</b> {allBanked ? 'All four filled in today' : 'Four grids in one sitting'} <em>(7, 2)</em></span>
            <span className="xw-row">
              {ENTRY.split('').map((ch, i) => (ch === '#'
                ? <i key={i} className="xw-c blk" />
                : <i key={i} className="xw-c" style={{ '--d': `${0.45 + i * 0.08}s` }}>{i === 0 ? <small>1</small> : null}<b>{ch}</b></i>))}
            </span>
            <span className="xw-go">{allBanked ? 'See your rank' : 'Pick up the pencil'} <span aria-hidden="true">&rarr;</span></span>
          </button>

          <div className="pp fade">
            <div className="pp-mast"><span>The Puzzle Page</span><b>Crossed Up</b><span>{dateShort}</span></div>
            <div className="pp-cols">
              {sections.map((s, i) => (
                <div key={s.key} className="clip" style={{ '--c': `var(--dj-${s.key})`, '--rot': `${[-1.4, 0.9, -0.6, 1.3][i % 4]}deg`, animationDelay: `${0.25 + i * 0.12}s` }}>
                  <div className="cl-k">Puzzle {NUMS[i] || i + 1}</div>
                  <Shape sec={s} />
                  <div className="cl-n">{s.name}</div>
                  <div className="cl-f">{s.form}</div>
                  <div className="cl-c">{s.chip}</div>
                  {banked[s.key]
                    ? <div className="cl-bk"><span>{banked[s.key].unknown ? 'Done today' : `Done ${banked[s.key].secs ? fmtClock(banked[s.key].secs) : `${banked[s.key].score}/${banked[s.key].total}`}`}</span></div>
                    : <div className="cl-w">{s.weight} points</div>}
                </div>
              ))}
            </div>
            <div className="pp-ft">Solved one today already? Your first time stands.</div>
          </div>

          <div className="pre-row fade">
            <button type="button" className="pre-how" aria-expanded={ladderOpen} onClick={() => setLadderOpen((v) => !v)}>{ladderOpen ? 'Hide the ranks' : 'Which day could you solve?'}</button>
          </div>
          {ladderOpen && (
            <div className="pre-lad">
              <div className="facts">
                <div className="fact"><b>{N}</b><span>crosswords</span></div>
                <div className="fact"><b>100</b><span>points in all</span></div>
                <div className="fact"><b>80%</b><span>of it is speed</span></div>
                <div className="fact"><b>{B.length}</b><span>ranks, Monday to In Pen</span></div>
              </div>
              <Ladder at={null} />
            </div>
          )}
          <div className="sub2 fade">Each puzzle is also its own daily: {sections.map((s, i) => <React.Fragment key={s.key}>{i ? ' · ' : ''}<a href={s.path}>{s.name}</a></React.Fragment>)}</div>
        </section>
      )}

      {hydrated && playing && sec && (
        <section className="dj-play" style={{ '--c': `var(--dj-${sec.key})` }}>
          <div className="dj-sechd">
            <span className="dj-sectag">Puzzle {NUMS[r.si] || r.si + 1} · {sec.form}</span>
            <b>{sec.name}</b>
            {!between && Game && !banked[sec.key] && (
              <button type="button" className="dj-tg" onClick={() => setHelpSeq((n) => n + 1)} title={`How to play ${sec.name}`}>
                <span aria-hidden="true">?</span> How to play
              </button>
            )}
            {!between && Game && !banked[sec.key] && (
              <button type="button" className="dj-tg" onClick={flipBoard} aria-pressed={boardTheme === 'light'} title={boardTheme === 'light' ? 'Switch the board to dark' : 'Switch the board to light'}>
                <span aria-hidden="true">{boardTheme === 'light' ? '\u263E' : '\u2600'}</span> {boardTheme === 'light' ? 'Dark board' : 'Light board'}
              </button>
            )}
            <span className="dj-run">Run total {Math.round(runSoFar + (between ? parts[r.si] : 0))}</span>
          </div>
          {!between && Game && !banked[sec.key] && (
            <div className={`dj-host${boardTheme === 'light' ? ' lt' : ''}`}>
              <RunEmbed onResult={onSectionDone} theme={boardTheme} help={helpSeq}>
                <Game key={`${sec.key}-${sec.num}`} puzzles={[sec.puzzle]} forceNum={null} />
              </RunEmbed>
            </div>
          )}
          {between && (
            <div className="dj-between">
              <div className="eb">{sec.name} · {banked[sec.key] && !r.results[sec.key] ? 'solved earlier today, the first time stands' : `puzzle ${(NUMS[r.si] || r.si + 1).toString().toLowerCase()} done`}</div>
              <div className="dj-bscore">{Math.round(parts[r.si])}<small>/{sec.weight}</small></div>
              {secDone.unknown ? <div className="dj-braw">Result on file</div> : (
                <div className="dj-split">
                  <div><span>Solve</span><b>{crossedAcc(secDone.score, secDone.total) >= 1 ? 'Clean' : 'Not solved'}</b><i style={{ width: `${Math.round(100 * crossedAcc(secDone.score, secDone.total))}%` }} /></div>
                  <div><span>Speed</span><b>{secDone.secs ? fmtClock(secDone.secs) : 'no clock'}</b><i style={{ width: `${Math.round(100 * crossedSpeed(sec.key, secDone.secs, CLK))}%` }} /><small>full marks under {fmtClock((CLK[sec.key] || CROSSED_CLOCK[sec.key])[0])}</small></div>
                </div>
              )}
              {!last ? (
                <button type="button" className="start" onClick={advance}>Next: Puzzle {NUMS[r.si + 1] || r.si + 2}, {sections[r.si + 1].name} <span aria-hidden="true">&rarr;</span></button>
              ) : (
                <div className="dj-rolling" role="status">Inking the results<span className="dj-dots" aria-hidden="true"><i /><i /><i /></span></div>
              )}
            </div>
          )}
        </section>
      )}

      <RunChallengeCapture gameKey={CROSSED_RUN_ID} />
      {hydrated && done && (
        <Grading key="grading" sections={sections} counted={counted} parts={parts} total={total} dateLabel={dateLabel} dateShort={dateShort}
          animate={doneAtLoad.current === false} board={board} clocks={CLK} onShare={copyShare} copied={copied}
          onSettled={() => setSettled(true)} />
      )}
      <MoreRunsPop self="crossed" ready={settled && doneAtLoad.current === false} delay={2500} fireOnLeave />
    </div>
  );
}

// ─── the ranks, top to bottom ───────────────────────────────────────────────
function Ladder({ at }) {
  return (
    <ol className="lad">
      {B.map((t, i) => (
        <li key={t[2]} className={at === i ? 'me' : ''} style={{ '--b': t[3], '--k': i === 0 ? '#e9cf7f' : crossedInkOn(t[3]) }}>
          <span className="lp" aria-hidden="true">{crossedDayTag(i)}</span>
          <span className="ln"><b>{t[1]}</b><small>{t[5]}</small></span>
          <span className="lc">{i === LOW ? 'any score' : `${t[0]}+`}</span>
        </li>
      ))}
    </ol>
  );
}

// The next rank up, and how far short. A near miss reads as nearly full.
function NextRank({ total, ti }) {
  if (ti <= 0) return <div className="ms top"><span>Top of the ladder</span><b>Nothing above In Pen.</b></div>;
  const up = B[ti - 1];
  const short = Math.max(1, up[0] - total);
  const fill = Math.max(4, Math.min(97, 100 * total / up[0]));
  return (
    <div className="ms" style={{ '--b': up[3], '--st': up[4] }}>
      <div className="ms-hd"><span>Next rank</span><em>{short} {short === 1 ? 'point' : 'points'} short</em></div>
      <div className="ms-nm">{up[1]}</div>
      <div className="ms-bar"><i style={{ width: `${fill}%` }} /><b>{up[0]}</b></div>
    </div>
  );
}

// ─── THE GRADING ────────────────────────────────────────────────────────────
// THE CURTAIN plays first, over the whole screen (app/crossed/CrossedCurtain.jsx):
// each puzzle paints the screen in its colour while its grid ripples in and its
// clock and points land, then the total climbs the week, then the seal. It plays once, on the
// finish itself, never for reduced motion or a run restored already finished,
// and any tap or key skips it. Then the settled card below, unchanged.
function Grading({ sections, counted, parts, total, dateLabel, dateShort, animate, board, clocks, onShare, copied, onSettled }) {
  const n = sections.length;
  const pts = parts.map((p) => Math.round(p));
  const fti = crossedTierOf(total);
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
        <CrossedCurtain sections={sections} counted={counted} parts={parts} total={total} runClock={runClockAll}
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
          <div className="gr-weekwrap">
            <div className="gr-ex">The week</div>
            <Week ti={face} circle={tied} />
            <div className="gr-weeknm" key={face}>{B[face][1]}</div>
          </div>
          {tied && <NextRank total={total} ti={fti} />}
          {sparks.map((p) => <i key={p.id} className="gr-spark" style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--d': `${p.ms}ms` }} />)}
        </div>
        <div className="gr-right">
          <div className="sh" aria-hidden={!settled}>
            <div className="sh-hd"><span>Grading sheet</span><span>{sections.length} puzzles</span></div>
            <div className="sh-lines">
              {sections.slice(0, lines).map((s, i) => (
                <div key={s.key} className="sh-l">
                  <span className="sh-c">Puzzle {i + 1}</span>
                  <span className="sh-n">{s.name}<small>{counted[i] && !counted[i].unknown ? `${crossedAcc(counted[i].score, counted[i].total) >= 1 ? 'Solved' : crossedAcc(counted[i].score, counted[i].total) > 0 ? `${Math.round(100 * crossedAcc(counted[i].score, counted[i].total))}% done` : 'Not solved'} in ${counted[i].secs ? fmtClock(counted[i].secs) : '?'}` : s.form}</small></span>
                  <b className={pts[i] >= s.weight - 1 ? 'top' : ''}>{pts[i]}<small>/{s.weight}</small></b>
                </div>
              ))}
            </div>
            <div className="sh-tot">
              <div><span>Run total</span><b>{cur}<small> / {CROSSED_MAX}</small></b></div>
              <div className="r"><span>Time in the grids</span><b className="clk">{fmtClock(runClock)}</b></div>
            </div>
            {(phase === 'seal' || tied) && <div className={`sh-seal${tied ? ' set' : ''}`}><span>Inked</span><small>{t[2]}</small></div>}
          </div>
        </div>
      </div>

      {settled && (
        <div className="gr-copy" role="status">
          <div className="gr-you">You solve like a</div>
          <h1 className="gr-nm">{t[1]}</h1>
          <p className="gr-ln">{t[5]}</p>
          <div className="gr-stats">
            <div><b>{total}/{CROSSED_MAX}</b><span>Run total</span></div>
            <div><b>{fmtClock(runClock)}</b><span>In the grids</span></div>
            {me && me.rank ? <a className="gr-lbl" href="/crossed/leaderboard" aria-label="See today's leaderboard"><b>#{me.rank}</b><span>{field ? `of ${Number(field).toLocaleString()} today` : 'today'}</span><em aria-hidden="true">&rarr;</em></a> : null}
          </div>
          <div className="gr-games">
            {sections.map((s, i) => <div key={s.key} className={flat ? '' : i === hi ? 'hi' : i === lo ? 'lo' : ''}><i>{s.name}</i><b>{counted[i] ? pts[i] : '-'}<small>/{s.weight}</small></b></div>)}
          </div>
          <CrossedBoard sections={sections} parts={parts} total={total} board={board} clocks={clocks} />
          <div style={{ margin: '14px 0 0' }}>
            <RunChallengeLine gameKey={CROSSED_RUN_ID} score={total} total={CROSSED_MAX} n={runToken()} />
            <RunChallengeButton gameKey={CROSSED_RUN_ID} score={total} total={CROSSED_MAX} n={runToken()} t={runClock > 0 ? Math.round(runClock) : null} status={t[1]} door />
          </div>
          <NextDrop label="Tomorrow's grids" sub="A new mini, a new nine by nine, new acrostics and a new Glyph at midnight Eastern." href="/crossed"
            accent="var(--dj-cta)" ink="var(--dj-ink)" mute="var(--dj-mute)" style={{ margin: '14px 0 0' }} />
          <MoreRunsList self="crossed" ink="var(--dj-ink)" mute="var(--dj-mute)" line="var(--dj-line)" onShare={onShare} copied={copied} />
          <div className="gr-lad"><div className="eb">The ranks</div><Ladder at={fti} /></div>
        </div>
      )}
    </section>
  );
}

// ─── TODAY'S BOARD (owner, 2026-10-19) ─────────────────────────────────────
// The Gauntlets' end-card board: today's top three plus your own row, each
// with the rank that total lands on and three bars, one
// per form, filled as a share of that form's points (so a full bar is full
// marks whatever the form is worth). Other players' bars are graded from their
// board rows with the same scorer and the same day's clocks the board itself
// ranks on; your own row uses the figures on the sheet above, so the two
// cannot disagree. It invents nothing: a row with no per-form data draws no bars.
function CrossedBoard({ sections, parts, total, board, clocks }) {
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
    return crossedGridPoints(key, p.score, p.total, p.timeElapsed, clocks || CROSSED_CLOCK);
  };
  const rankName = (pts) => B[crossedTierOf(pts)][1];
  const top = rows.slice(0, 3);
  const meInTop = !!(meKey && top.some((x) => x.userKey === meKey));
  const out = top.map((x, i) => {
    const mine = !!(meKey && x.userKey === meKey);
    const t = Math.round(Number(x.total) || 0);
    return {
      key: x.userKey || `r${i}`, rank: String(x.rank || i + 1), name: x.username || 'Player', total: mine ? total : t,
      sub: [rankName(mine ? total : t), mine && ahead != null ? `ahead of ${ahead}%` : ''].filter(Boolean).join(' · '),
      ti: crossedTierOf(mine ? total : t), me: mine, rc: ['#e8b43a', '#b8bcc4', '#c8814b'][i],
      per: mine ? parts : (x.perGame ? sections.map((s) => shareOf(s.key, x.perGame[s.key])) : null),
    };
  });
  if (me && !meInTop && meRank) {
    out.push({
      key: 'me', rank: String(meRank), name: me.username || 'You', total,
      sub: [rankName(total), ahead != null ? `ahead of ${ahead}%` : ''].filter(Boolean).join(' · '),
      ti: crossedTierOf(total), me: true, rc: 'var(--dj-cta)', per: parts,
    });
  }
  const names = sections.map((s) => s.name);
  const listed = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names.join('');
  return (
    <div className="db">
      <div className="db-hd">
        <span>Today&rsquo;s board{fieldN ? ` · ${Number(fieldN).toLocaleString()} ${fieldN === 1 ? 'player' : 'players'}` : ''}</span>
        <a href="/crossed/leaderboard">Full board</a>
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

const CSS = WEEK_CSS + `
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
.xw{display:block;width:100%;max-width:520px;margin:22px auto 0;padding:0;border:0;border-radius:14px;background:var(--dj-paper);color:#1b1a17;box-shadow:0 14px 34px rgba(0,0,0,.55);overflow:hidden;cursor:pointer;font:inherit;text-align:left}
.xw-clue{display:block;padding:14px 18px 0;font:600 15px/1.35 ${SERIF};color:#3b352b}
.xw-clue b{font:800 11px ${SANS};letter-spacing:.14em;text-transform:uppercase;color:var(--dj-seal);margin-right:6px}
.xw-clue em{font-style:normal;font-weight:700;color:#7a6f5c}
.xw-row{display:flex;margin:12px 18px 16px;border:2px solid #1b1a17}
.xw-c{position:relative;flex:1 1 0;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-left:1px solid #1b1a17;background:#fffdf7;font-style:normal}
.xw-c:first-child{border-left:0}
.xw-c.blk{background:#1b1a17}
.xw-c small{position:absolute;left:3px;top:1px;font:800 9px ${SANS};color:#1b1a17}
.xw-c b{font:600 clamp(18px,4.6vw,28px) ${SANS};color:#7a7468;animation:xwtype .18s ease var(--d) both}
.xw-c:not(.blk){animation:xwcur .5s ease var(--d) both}
@keyframes xwtype{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
@keyframes xwcur{0%{background:#fde68a}100%{background:#fffdf7}}
.xw:hover .xw-c:not(.blk){background:#fff7d6}
.xw.go .xw-c b{color:#0f1c4d;font-weight:900;transition:color .25s ease}
.xw.go .xw-c:not(.blk){animation:xwink .4s ease both}
.xw.go .xw-c:nth-child(2){animation-delay:.04s}.xw.go .xw-c:nth-child(3){animation-delay:.08s}.xw.go .xw-c:nth-child(4){animation-delay:.12s}.xw.go .xw-c:nth-child(5){animation-delay:.16s}.xw.go .xw-c:nth-child(6){animation-delay:.2s}.xw.go .xw-c:nth-child(7){animation-delay:.24s}.xw.go .xw-c:nth-child(9){animation-delay:.32s}.xw.go .xw-c:nth-child(10){animation-delay:.36s}
@keyframes xwink{0%{background:#fffdf7}40%{background:#dbe6ff}100%{background:#fffdf7}}
.xw-go{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px;padding:15px 18px;background:var(--dj-cta);color:var(--dj-cta-ink);font:900 19px ${SANS}}
.xw-go::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transform:translateX(-100%);animation:djsheen 2.6s 1.6s ease-in-out infinite}
@keyframes djsheen{to{transform:translateX(100%)}}
.xw:focus-visible,.pre-how:focus-visible{outline:2px solid var(--dj-ink);outline-offset:3px}
.pp{max-width:720px;margin:30px auto 0;padding:14px 18px 16px;background:var(--dj-paper);color:#1b1a17;border-radius:4px;box-shadow:0 18px 40px rgba(0,0,0,.5)}
.pp-mast{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding-bottom:8px;border-bottom:3px double #1b1a17}
.pp-mast span{font:800 10px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:#5a5244}
.pp-mast b{font:800 italic 26px/1 ${SERIF};letter-spacing:-.01em}
.pp-cols{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:16px}
.clip{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;padding:12px 10px 12px;background:#fffdf7;border:1.5px dashed #8a7f6a;border-top:4px solid var(--c);transform:rotate(var(--rot));animation:clipin .55s cubic-bezier(.2,1.1,.4,1) both}
@keyframes clipin{from{opacity:0;transform:translateY(16px) rotate(calc(var(--rot) * 3))}to{opacity:1;transform:rotate(var(--rot))}}
.cl-k{font:800 9.5px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:#7a6f5c}
.cl-g{display:grid;height:62px;max-width:100%;margin:10px 0 8px;border:1.5px solid #1b1a17;background:#1b1a17;gap:1px}
.cl-g i{background:#fffdf7}
.cl-g i.b{background:#1b1a17}
.cl-n{font:700 22px/1.1 ${SERIF}}
.cl-f{font:800 10.5px ${SANS};letter-spacing:.06em;text-transform:uppercase;color:#4a4236;margin-top:4px}
.cl-c{font:600 11.5px/1.3 ${SANS};color:#6c604c;margin-top:6px}
.cl-w{margin-top:auto;padding-top:10px;font:800 10px ${SANS};letter-spacing:.12em;text-transform:uppercase;color:var(--dj-seal)}
.cl-bk{margin-top:auto;padding-top:10px}
.cl-bk span{display:inline-block;font:900 10.5px ${SANS};letter-spacing:.1em;text-transform:uppercase;color:#2f5d3a;border:2px solid #2f5d3a;border-radius:4px;padding:3px 7px;transform:rotate(-4deg)}
.pp-ft{margin-top:14px;padding-top:8px;border-top:1px solid rgba(27,26,23,.25);font:600 12px ${SANS};color:#5a5244;text-align:center}
.pre-row{display:flex;justify-content:center;max-width:640px;margin:14px auto 0}
.pre-how{background:none;border:0;padding:6px 0;color:var(--dj-gold);font:800 13px ${SANS};text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.sub2{margin-top:12px;font-size:12.5px;font-weight:700;color:var(--dj-mute)}
.sub2 a{color:var(--dj-ink)}
.pre-lad{max-width:560px;margin:10px auto 0;animation:djrise .3s ease both}
.facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0 14px}
.fact{background:var(--dj-panel);border:1.5px solid var(--dj-line);border-radius:12px;padding:9px 10px;text-align:left}
.fact b{display:block;font-size:20px;font-weight:900}
.fact span{font-size:11px;font-weight:700;color:var(--dj-mute);line-height:1.25;display:block}
.pre.leave .clip{animation:clipout .5s cubic-bezier(.6,0,.8,.4) both !important}
.pre.leave .clip:nth-child(2){animation-delay:.05s !important}.pre.leave .clip:nth-child(3){animation-delay:.1s !important}.pre.leave .clip:nth-child(4){animation-delay:.15s !important}
@keyframes clipout{to{opacity:0;transform:translateY(24px) rotate(calc(var(--rot) * -2))}}
.pre.leave .fade:not(.xw):not(.pp){transition:opacity .4s .3s;opacity:0}
.pre.leave .pp{transition:opacity .35s .45s;opacity:0}
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
.lad li.me{border-color:var(--dj-gold);box-shadow:0 0 0 1px var(--dj-gold) inset;background:rgba(233,207,127,.08)}
.lad .lp{flex:none;width:38px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:3px;background:var(--b);color:var(--k);font:800 10.5px ${SANS};letter-spacing:.04em;box-shadow:0 0 0 1.5px rgba(255,255,255,.3)}
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
.gr-weekwrap{display:flex;flex-direction:column;align-items:center;gap:12px;padding:22px 20px 14px;border-radius:16px;background:radial-gradient(ellipse at 50% 30%,rgba(255,255,255,.07),transparent 70%)}
.gr-weekwrap .cw{--s:46px}
.gr-ex{font:800 10px ${SANS};letter-spacing:.18em;text-transform:uppercase;color:var(--dj-mute)}
.gr-weeknm{font:700 26px/1.1 ${SERIF};animation:djrise .3s ease both}
.gr-upg{position:absolute;left:50%;top:-6px;font:800 11px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:var(--dj-cta-ink);background:var(--dj-cta);padding:6px 11px;border-radius:999px;white-space:nowrap;z-index:4;animation:djup 1s ease-out both}
@keyframes djup{0%{opacity:0;transform:translate(-50%,12px)}20%{opacity:1;transform:translate(-50%,0)}75%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-8px)}}
.gr-spark{position:absolute;left:50%;top:40%;width:6px;height:6px;margin:-3px;border-radius:50%;background:var(--dj-gold);z-index:5;pointer-events:none;animation:djspark var(--d) cubic-bezier(.2,.7,.3,1) both}
@keyframes djspark{from{transform:translate(0,0) scale(1);opacity:1}to{transform:translate(var(--x),var(--y)) scale(.2);opacity:0}}
.ms{width:min(320px,92%);margin-top:14px;padding:11px 13px 12px;border-radius:10px;background:var(--dj-surf);border:1px dashed var(--dj-line);text-align:left;animation:djrise .5s .5s ease both}
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
.sh-l{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px dashed rgba(31,36,48,.2);animation:djrise .3s ease both}
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
.db-row.me{border-color:var(--dj-cta);background:rgba(125,211,252,.08)}
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
@media(max-width:600px){.pp{padding:12px 12px 14px}.pp-mast b{font-size:21px}.pp-mast span:last-child{display:none}.pp-cols{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.cl-n{font-size:18px}.cl-c{display:none}.gr-weekwrap .cw{--s:min(42px,calc((100vw - 48px) / 7))}.title{font-size:44px}.lede{font-size:14px}.pre-row .sub2{font-size:11.5px;max-width:200px}.facts{gap:5px}.fact{padding:7px}.fact b{font-size:16px}.fact span{font-size:9.5px}.dj-sechd b{font-size:16px}}
@media(prefers-reduced-motion:reduce){.dj *{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition:none !important}}
`;
