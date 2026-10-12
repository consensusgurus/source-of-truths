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
// by form while the belt on the left is dyed up the ladder colour by colour,
// then the examiner's seal comes down and the belt is tied. The ending starts
// on its own after the last grid, as Judged's and Price Check's do.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import RunEmbed from '../RunEmbed';
import NextDrop from '../NextDrop';
import MoreRunsPop, { MoreRunsList } from '../circuits/MoreRuns';
import useCircuitBoard from '../circuits/useCircuitBoard';
import { withRef } from '@/lib/referrals';
import { isMobileDevice } from '@/lib/is-mobile';
import { DOJO_RUN_ID, DOJO_BELTS, DOJO_CLOCK, DOJO_MAX, dojoTierOf, dojoGridPoints, dojoAcc, dojoSpeed } from '@/lib/dojo';

const CLIENTS = {
  sixes: dynamic(() => import('../sixes/SixesClient'), { ssr: false, loading: () => null }),
  suds: dynamic(() => import('../suds/SudsClient'), { ssr: false, loading: () => null }),
  sando: dynamic(() => import('../sando/SandoClient'), { ssr: false, loading: () => null }),
  quilt: dynamic(() => import('../quilt/QuiltClient'), { ssr: false, loading: () => null }),
  mercury: dynamic(() => import('../mercury/MercuryClient'), { ssr: false, loading: () => null }),
  cages: dynamic(() => import('../cages/CagesClient'), { ssr: false, loading: () => null }),
  knight: dynamic(() => import('../knight/KnightClient'), { ssr: false, loading: () => null }),
  polka: dynamic(() => import('../polka/PolkaClient'), { ssr: false, loading: () => null }),
  frame: dynamic(() => import('../frame/FrameClient'), { ssr: false, loading: () => null }),
  diag: dynamic(() => import('../diag/DiagClient'), { ssr: false, loading: () => null }),
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmtClock = (s) => { const v = Math.max(0, Math.round(Number(s) || 0)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };

// The first (counted) play of a grid today, read off the game's own save and
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

// A belt drawn in CSS: the band, the knot, two tails, and the rank tab on the
// right tail (gold bars on black, a darker tab on every other colour).
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

export default function DojoClient({ dateLabel, dateShort, sections = [] }) {
  const N = sections.length;
  const STORE = `sot_run_dojo_${etToday()}`;
  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [leaving, setLeaving] = useState(false);
  const [ladderOpen, setLadderOpen] = useState(false);
  const [holding, setHolding] = useState(null);
  const [copied, setCopied] = useState(false);
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
  const board = useCircuitBoard(DOJO_RUN_ID, hydrated && done);

  const counted = useMemo(() => sections.map((sec) => banked[sec.key] || r.results[sec.key] || null), [sections, banked, r.results]);
  const parts = counted.map((c, i) => (c ? dojoGridPoints(sections[i].key, c.score, c.total, c.secs) : 0));
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
    setTimeout(() => setHolding((h) => (h === sec.key ? null : h)), 1700);
  }, [sections, commit]);

  const sec = playing ? sections[r.si] : null;
  const secDone = sec ? (banked[sec.key] || r.results[sec.key]) : null;
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
  const variant = sections[N - 1];

  return (
    <div className="stage-page dj" data-stage-theme="dark" style={{ ...VARS, minHeight: '100vh', background: 'var(--dj-ground)', color: 'var(--dj-ink)', fontFamily: SANS, overflowX: 'hidden', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="dj-cap">
        <Link href="/" className="dj-home">Mind Loft</Link>
        <b>Enter the Dojo</b>
        <span className="dj-capd">{dateShort}</span>
        {playing && <span className="dj-capt">{sections.map((s, i) => <i key={s.key} className={i < r.si ? 'd' : i === r.si ? 'on' : ''} style={{ background: i <= r.si ? `var(--dj-${s.key})` : undefined }} title={s.name} />)}</span>}
        {!playing && <a className="dj-lb" href="/dojo/leaderboard">Leaderboard</a>}
      </div>

      {hydrated && r.phase === 'idle' && (
        <section className={`pre${leaving ? ' leave' : ''}`}>
          <div className="eb fade">{dateLabel} · Daily sudoku run</div>
          <h1 className="title fade">{'Enter the Dojo'.split(' ').map((w, i) => <span key={i} style={{ animationDelay: `${i * 0.09}s` }}>{w}</span>)}</h1>
          <p className="lede fade">Three sudokus in one sitting: <b>a six by six warm-up</b>, <b>the classic nine by nine</b>, then <b>{(variant && variant.phrase) || 'a variant'}</b>. Solving counts half, <b>speed</b> counts the other half. <span className="lede-x">Your score decides the belt you tie on.</span></p>

          {/* THE DOORS ARE THE START BUTTON: two paper panels that slide
              apart, and the light behind them, before the first grid. */}
          <button type="button" className={`door fade${leaving ? ' open' : ''}`} onClick={start} aria-label={allBanked ? 'See your belt' : 'Step onto the mat'}>
            <span className="door-frame">
              <span className="door-light" />
              <span className="door-p l"><i /></span>
              <span className="door-p r"><i /></span>
              <span className="door-sign">{allBanked ? 'All three done today' : 'The mat is ready'}</span>
            </span>
            <span className="door-go">{allBanked ? 'See your belt' : 'Step onto the mat'} <span aria-hidden="true">&rarr;</span></span>
          </button>

          <div className="wall">
            {sections.map((s, i) => (
              <div key={s.key} className="scroll" style={{ '--c': `var(--dj-${s.key})`, animationDelay: `${0.25 + i * 0.14}s` }}>
                <i className="rod t" />
                <div className="sc-body">
                  <div className="sc-k">Form {NUMS[i] || i + 1}</div>
                  <div className="sc-n">{s.name}</div>
                  <div className="sc-f">{s.form}</div>
                  <div className="sc-c">{s.chip}</div>
                  {banked[s.key]
                    ? <div className="sc-bk">{banked[s.key].unknown ? 'Done today' : `Done: ${banked[s.key].secs ? fmtClock(banked[s.key].secs) : `${banked[s.key].score}/${banked[s.key].total}`}`}<span className="sc-bkx"> · it stands</span></div>
                    : <div className="sc-w">{s.weight} points</div>}
                </div>
                <i className="rod b" />
              </div>
            ))}
          </div>

          <div className="pre-row fade">
            <div className="sub2">Solved one today already? Your first time stands.</div>
            <button type="button" className="pre-how" aria-expanded={ladderOpen} onClick={() => setLadderOpen((v) => !v)}>{ladderOpen ? 'Hide the belts' : 'Which belt could you earn?'}</button>
          </div>
          {ladderOpen && (
            <div className="pre-lad">
              <div className="facts">
                <div className="fact"><b>{N}</b><span>grids</span></div>
                <div className="fact"><b>100</b><span>points in all</span></div>
                <div className="fact"><b>50%</b><span>of it is speed</span></div>
                <div className="fact"><b>{B.length}</b><span>belts, white to black</span></div>
              </div>
              <Ladder at={null} />
            </div>
          )}
          <div className="sub2 fade">Each grid is also its own daily: {sections.map((s, i) => <React.Fragment key={s.key}>{i ? ' · ' : ''}<a href={s.path}>{s.name}</a></React.Fragment>)}</div>
        </section>
      )}

      {hydrated && playing && sec && (
        <section className="dj-play" style={{ '--c': `var(--dj-${sec.key})` }}>
          <div className="dj-sechd">
            <span className="dj-sectag">Form {NUMS[r.si] || r.si + 1} · {sec.form}</span>
            <b>{sec.name}</b>
            <span className="dj-run">Run total {Math.round(runSoFar + (between ? parts[r.si] : 0))}</span>
          </div>
          {!between && Game && !banked[sec.key] && (
            <div className="dj-host">
              <RunEmbed onResult={onSectionDone}>
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
                  <div><span>Solve</span><b>{dojoAcc(secDone.score, secDone.total) >= 1 ? 'Clean' : 'Not solved'}</b><i style={{ width: `${Math.round(100 * dojoAcc(secDone.score, secDone.total))}%` }} /></div>
                  <div><span>Speed</span><b>{secDone.secs ? fmtClock(secDone.secs) : 'no clock'}</b><i style={{ width: `${Math.round(100 * dojoSpeed(sec.key, secDone.secs))}%` }} /><small>full marks under {fmtClock(DOJO_CLOCK[sec.key][0])}</small></div>
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

      {hydrated && done && (
        <Grading key="grading" sections={sections} counted={counted} parts={parts} total={total} dateLabel={dateLabel}
          animate={doneAtLoad.current === false} board={board} onShare={copyShare} copied={copied}
          onSettled={() => setSettled(true)} />
      )}
      <MoreRunsPop self="dojo" ready={settled && doneAtLoad.current === false} delay={2500} fireOnLeave />
    </div>
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
// The sheet scores form by form and the total counts up; the belt on the left
// starts white and is dyed the next colour up each time the running total
// crosses a cutoff. Then the examiner's seal comes down and the belt is tied.
function Grading({ sections, counted, parts, total, dateLabel, animate, board, onShare, copied, onSettled }) {
  const n = sections.length;
  const pts = parts.map((p) => Math.round(p));
  const fti = dojoTierOf(total);
  const t = B[fti];
  const reduce = useMemo(() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }, []);
  const play = animate && !reduce;
  const [lines, setLines] = useState(play ? 0 : n);
  const [cur, setCur] = useState(play ? 0 : total);
  const [face, setFace] = useState(play ? LOW : fti);
  const [dye, setDye] = useState(false);
  const [upg, setUpg] = useState(null);
  const [phase, setPhase] = useState(play ? 'grade' : 'settled');
  const [sparks, setSparks] = useState([]);

  function burst(k) {
    const id = Date.now();
    const list = Array.from({ length: k }, (_, i) => {
      const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 120;
      return { id: `${id}-${i}`, x: Math.cos(a) * d, y: Math.sin(a) * d, ms: 900 + Math.random() * 500 };
    });
    setSparks((s) => [...s, ...list]);
    setTimeout(() => setSparks((s) => s.filter((p) => !list.includes(p))), 1600);
  }

  useEffect(() => {
    if (!play) return undefined;
    let alive = true;
    (async () => {
      await sleep(550);
      let acc = 0, ti = LOW;
      for (let i = 0; i < n; i++) {
        if (!alive) return;
        setLines(i + 1);
        const from = acc, to = acc + parts[i], steps = Math.max(1, Math.round(parts[i]));
        for (let k = 1; k <= steps; k++) {
          if (!alive) return;
          const shown = Math.round(from + (to - from) * k / steps);
          setCur(shown);
          const nt = dojoTierOf(shown);
          if (nt < ti) {
            ti = nt;
            setFace(nt); setDye(true);
            setUpg({ k: `${nt}-${Date.now()}`, text: `${B[nt][1]}` });
            burst(nt <= 1 ? 14 : 8);
            await sleep(260);
            if (!alive) return;
            setDye(false);
          }
          await sleep(40);
        }
        acc = to;
        await sleep(360);
      }
      if (!alive) return;
      setCur(total);
      await sleep(350);
      setPhase('seal');
      await sleep(1250);
      if (!alive) return;
      setPhase('tie');
      await sleep(1700);
      if (!alive) return;
      setPhase('settled');
      if (fti <= 1) burst(22);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const me = board && board.data && board.data.me;
  const field = board && board.data && Array.isArray(board.data.overall) ? (board.data.uniquePlayers || board.data.overall.length) : null;
  let hi = 0, lo = 0;
  pts.forEach((v, i) => { if (v / sections[i].weight > pts[hi] / sections[hi].weight) hi = i; if (v / sections[i].weight < pts[lo] / sections[lo].weight) lo = i; });
  const flat = pts[hi] / sections[hi].weight === pts[lo] / sections[lo].weight;
  const settled = phase === 'settled';
  useEffect(() => { if (settled && onSettled) onSettled(); }, [settled]); // eslint-disable-line react-hooks/exhaustive-deps
  const tied = phase === 'tie' || settled;
  const runClock = counted.reduce((a, c) => a + ((c && c.secs) || 0), 0);

  return (
    <section className="gr">
      <div className="eb">{dateLabel} · Enter the Dojo</div>
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
                  <span className="sh-n">{s.name}<small>{counted[i] && !counted[i].unknown ? `${dojoAcc(counted[i].score, counted[i].total) >= 1 ? 'Solved' : 'Not solved'} in ${counted[i].secs ? fmtClock(counted[i].secs) : '?'}` : s.form}</small></span>
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
          <div className="gr-you">You tied on the</div>
          <h1 className="gr-nm">{t[1]}</h1>
          <p className="gr-ln">{t[5]}</p>
          <div className="gr-stats">
            <div><b>{total}/{DOJO_MAX}</b><span>Run total</span></div>
            <div><b>{fmtClock(runClock)}</b><span>On the mat</span></div>
            {me && me.rank ? <div><b>#{me.rank}</b><span>{field ? `of ${Number(field).toLocaleString()} today` : 'today'}</span></div> : null}
          </div>
          <div className="gr-games">
            {sections.map((s, i) => <div key={s.key} className={flat ? '' : i === hi ? 'hi' : i === lo ? 'lo' : ''}><i>{s.name}</i><b>{counted[i] ? pts[i] : '-'}<small>/{s.weight}</small></b></div>)}
          </div>
          <NextDrop label="Tomorrow's forms" sub="A new six by six, a new classic and a new variant at midnight Eastern." href="/dojo"
            accent="var(--dj-cta)" ink="var(--dj-ink)" mute="var(--dj-mute)" style={{ margin: '14px 0 0', maxWidth: 420 }} />
          <div className="gr-btns">
            <button type="button" className="pri" onClick={onShare}>{copied ? 'Copied' : 'Share your belt'}</button>
            <a href="/dojo/leaderboard">Leaderboard</a>
            <a href="/">Back to main</a>
          </div>
          <MoreRunsList self="dojo" ink="var(--dj-ink)" mute="var(--dj-mute)" line="var(--dj-line)" />
          <div className="gr-lad"><div className="eb">The belts</div><Ladder at={fti} /></div>
        </div>
      )}
    </section>
  );
}

const CSS = `
.dj *{box-sizing:border-box}
.dj .eb{font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--dj-mute)}
.dj-cap{display:flex;align-items:center;gap:12px;max-width:820px;margin:0 auto;padding:12px 16px;font-size:13px}
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
.sh-seal{position:absolute;right:18px;top:40px;width:104px;height:104px;border:5px solid var(--dj-seal);border-radius:12px;color:var(--dj-seal);display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-10deg);mix-blend-mode:multiply;animation:djseal .45s cubic-bezier(.2,1.6,.4,1) both;background:rgba(180,35,42,.06)}
.sh-seal span{font:900 15px ${SANS};letter-spacing:.12em;text-transform:uppercase}
.sh-seal small{font:800 10px ${MONO};letter-spacing:.16em;margin-top:4px}
.sh-seal.set{animation:none;opacity:.85}
@keyframes djseal{from{opacity:0;transform:rotate(-10deg) scale(2.6)}to{opacity:.88;transform:rotate(-10deg) scale(1)}}
.gr-copy{max-width:560px;margin:8px auto 0;animation:djrise .6s .1s ease both}
.gr-you{font:800 12px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:var(--dj-gold)}
.gr-nm{font-size:clamp(32px,5vw,48px);font-weight:900;letter-spacing:-.02em;line-height:1.05;margin:8px 0 10px}
.gr-ln{font-size:17px;line-height:1.45;margin:0 0 16px;color:var(--dj-ink)}
.gr-stats{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:8px;margin-bottom:10px}
.gr-stats div{background:var(--dj-surf);border:1px solid var(--dj-line);border-radius:12px;padding:9px 11px;display:flex;flex-direction:column;gap:3px;min-width:0}
.gr-stats b{font:500 20px ${MONO};white-space:nowrap}
.gr-stats span{font:800 9.5px ${SANS};letter-spacing:.12em;text-transform:uppercase;color:var(--dj-mute)}
.gr-games{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.gr-games div{background:var(--dj-surf);border:1px solid var(--dj-line);border-radius:9px;padding:8px 4px;text-align:center;min-width:0}
.gr-games i{display:block;font:normal 800 9px ${SANS};letter-spacing:.06em;text-transform:uppercase;color:var(--dj-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gr-games b{font:500 18px ${MONO}}
.gr-games b small{font-size:11px;color:var(--dj-mute)}
.gr-games .hi{border-color:var(--dj-gold)}.gr-games .hi b{color:var(--dj-gold)}
.gr-games .lo b{color:var(--dj-bad)}
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
.sh-seal{width:84px;height:84px;top:44px;right:12px}
}
@media(max-width:600px){.wall{gap:8px;padding:18px 8px 14px}.sc-body{padding:10px 5px;min-height:140px}.sc-n{font-size:17px}.sc-c{display:none}.sc-f{font-size:9.5px}.sc-k{font-size:8px;letter-spacing:.08em}.sc-bkx{display:none}.title{font-size:44px}.lede{font-size:14px}.pre-row .sub2{font-size:11.5px;max-width:200px}.facts{gap:5px}.fact{padding:7px}.fact b{font-size:16px}.fact span{font-size:9.5px}.dj-sechd b{font-size:16px}.door-frame{height:110px}.bt{width:240px}}
@media(prefers-reduced-motion:reduce){.dj *{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition:none !important}}
`;
