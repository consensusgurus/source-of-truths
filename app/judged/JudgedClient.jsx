'use client';

// JUDGED — the five deduction dailies as one run (owner, 2026-10-08).
//
// Docket, Sworn, Hearsay, Alibi and Stands back to back on one page, each
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
// THE PREGAME is a desk of five case folders and a gavel that is the Start
// button. THE ENDING grades the transcript case by case while a pennant on
// the left climbs the ladder school by school, then the committee stamps the
// file ADMITTED and the letter slides out of its envelope. The ending starts
// on its own after the last case, as Price Check's does.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import RunEmbed from '../RunEmbed';
import NextDrop from '../NextDrop';
import useCircuitBoard from '../circuits/useCircuitBoard';
import { withRef } from '@/lib/referrals';
import { isMobileDevice } from '@/lib/is-mobile';
import { LAW_RUN_ID, LAW_LADDER, LAW_CLOCK, LAW_CASE_MAX, LAW_MAX, lawLadderFor, lawTierOf, lawIndexOf, lawCasePoints, lawAcc, lawSpeed } from '@/lib/law-school';

const CLIENTS = {
  sworn: dynamic(() => import('../sworn/SwornClient'), { ssr: false, loading: () => null }),
  hearsay: dynamic(() => import('../hearsay/HearsayClient'), { ssr: false, loading: () => null }),
  docket: dynamic(() => import('../docket/DocketClient'), { ssr: false, loading: () => null }),
  alibi: dynamic(() => import('../alibi/AlibiClient'), { ssr: false, loading: () => null }),
  stands: dynamic(() => import('../stands/StandsClient'), { ssr: false, loading: () => null }),
};

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const SERIF = "'Newsreader', Georgia, 'Times New Roman', serif";
const LOW = LAW_LADDER.length - 1;

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
const freshRun = () => ({ v: 1, phase: 'idle', si: 0, t0: null, results: {} });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
  const MAX = N * LAW_CASE_MAX;
  const STORE = `sot_run_judged_${etToday()}`;
  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [leaving, setLeaving] = useState(false);
  const [ladderOpen, setLadderOpen] = useState(false);
  const [holding, setHolding] = useState(null);
  const [copied, setCopied] = useState(false);
  const doneAtLoad = useRef(null);

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
  // Each case: 25 points, half accuracy and half speed (lib/law-school.js).
  const parts = counted.map((c, i) => (c ? lawCasePoints(sections[i].key, c.score, c.total, c.secs) : 0));
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
    }, 760);
  }

  // A case reports its filed result. The finished board holds for a beat so
  // the player sees how it ended, then the ruling card takes its place.
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
  // THE LAST CASE ROLLS STRAIGHT INTO THE VERDICT, no button.
  useEffect(() => {
    if (!between || !last) return undefined;
    const t = setTimeout(() => advance(), 1900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [between, last]);

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

  const VARS = { '--ls-ground': '#0b0f1a', '--ls-panel': '#0d1220', '--ls-surf': 'rgba(255,255,255,.045)', '--ls-line': 'rgba(255,255,255,.12)', '--ls-ink': '#e9edf4', '--ls-mute': '#9aa8c4', '--ls-cta': '#7dd3fc', '--ls-cta-ink': '#08222e', '--ls-gold': '#e9cf7f', '--ls-good': '#6ee7b7', '--ls-bad': '#fb7185', '--ls-paper': '#f6f1e4', '--ls-manila': '#e6c98f' };
  sections.forEach((s) => { VARS[`--ls-${s.key}`] = s.color; });
  const runSoFar = sections.slice(0, r.si).reduce((a, s, i) => a + (counted[i] ? parts[i] : 0), 0);
  const Game = sec ? CLIENTS[sec.key] : null;

  return (
    <div className="stage-page ls" data-stage-theme="dark" style={{ ...VARS, minHeight: '100vh', background: 'var(--ls-ground)', color: 'var(--ls-ink)', fontFamily: SANS, overflowX: 'hidden', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ls-cap">
        <Link href="/" className="ls-home">Mind Loft</Link>
        <b>Judged</b>
        <span className="ls-capd">{dateShort}</span>
        {playing && <span className="ls-capt">{sections.map((s, i) => <i key={s.key} className={i < r.si ? 'd' : i === r.si ? 'on' : ''} style={{ background: i <= r.si ? `var(--ls-${s.key})` : undefined }} title={s.name} />)}</span>}
        {!playing && <a className="ls-lb" href="/judged/leaderboard">Leaderboard</a>}
      </div>

      {hydrated && r.phase === 'idle' && (
        <section className={`pre${leaving ? ' leave' : ''}`}>
          <div className="eb fade">{dateLabel} · Judged</div>
          <h1 className="title"><span>Judged</span></h1>
          <p className="lede fade">Five cases in one sitting, opening with <b>an LSAT-style logic game</b>, then liars under oath, hearsay, an alibi and a record to rebuild. Right counts half, <b>fast</b> counts the other half. <span className="lede-x">Your score decides which law school lets you in.</span></p>
          {/* THE GAVEL IS THE START BUTTON: the block it strikes, the label
              under it, and the strike plays before the folders clear. */}
          <button type="button" className={`gav fade${leaving ? ' strike' : ''}`} onClick={start} aria-label="Begin the exam">
            <span className="gscr">
              <svg className="gv" viewBox="0 0 120 70" aria-hidden="true">
                <g className="gv-arm">
                  <rect x="56" y="6" width="9" height="46" rx="3" fill="#8a5a2b" />
                  <rect x="38" y="2" width="44" height="18" rx="6" fill="#6b4220" />
                  <rect x="38" y="7" width="44" height="3" fill="#c79a5b" opacity=".7" />
                </g>
                <rect x="30" y="56" width="60" height="10" rx="3" fill="#6b4220" />
                <rect x="36" y="52" width="48" height="6" rx="2" fill="#8a5a2b" />
              </svg>
              <small>{allBanked ? 'All five argued today' : 'The committee is seated'}</small>
            </span>
            <span className="gtrig">{allBanked ? 'Open your letter' : 'Begin the exam'} <span aria-hidden="true">&rarr;</span></span>
          </button>
          <div className="desk">
            {sections.map((s, i) => (
              <div key={s.key} className="fold" style={{ '--c': `var(--ls-${s.key})`, animationDelay: `${0.2 + i * 0.12}s`, '--r': `${[-4, 2, -1, 3, -3][i % 5]}deg` }}>
                <div className="ftab">Case {String(i + 1).padStart(2, '0')}</div>
                <div className="fbody">
                  <div className="fk">{s.file}</div>
                  <div className="fn">{s.name}</div>
                  <div className="fc">{s.chip}</div>
                  {banked[s.key]
                    ? <div className="fbk"><span className="fbk-x">Argued today: </span>{banked[s.key].unknown ? 'on file' : `${banked[s.key].score}/${banked[s.key].total}`}<span className="fbk-x">{banked[s.key].unknown ? '' : ' stands'}</span></div>
                    : <div className="fseal">SEALED</div>}
                </div>
              </div>
            ))}
          </div>
          <div className="pre-row fade">
            <div className="sub2">Argued one today? Your first result stands.</div>
            <button type="button" className="pre-how" aria-expanded={ladderOpen} onClick={() => setLadderOpen((v) => !v)}>{ladderOpen ? 'Hide the schools' : 'Which schools could take you?'}</button>
          </div>
          {ladderOpen && (
            <div className="pre-lad">
              <div className="facts">
                <div className="fact"><b>{N}</b><span>cases</span></div>
                <div className="fact"><b>20</b><span>points each</span></div>
                <div className="fact"><b>50%</b><span>of it is speed</span></div>
                <div className="fact"><b>8</b><span>schools on the ladder</span></div>
              </div>
              <Ladder at={null} L={L} />
            </div>
          )}
          <div className="sub2 fade">Each case is also its own daily: {sections.map((s, i) => <React.Fragment key={s.key}>{i ? ' · ' : ''}<a href={s.path}>{s.name}</a></React.Fragment>)}</div>
        </section>
      )}

      {hydrated && playing && sec && (
        <section className="ls-play" style={{ '--c': `var(--ls-${sec.key})` }}>
          <div className="ls-sechd">
            <span className="ls-sectag">Case {String(r.si + 1).padStart(2, '0')} · {sec.file}</span>
            <b>{sec.name}</b>
            <span className="ls-run">Run total {Math.round(runSoFar + (between ? parts[r.si] : 0))}</span>
          </div>
          {!between && Game && !banked[sec.key] && (
            <div className="ls-host">
              <RunEmbed onResult={onSectionDone}>
                <Game key={`${sec.key}-${sec.num}`} puzzles={[sec.puzzle]} forceNum={null} />
              </RunEmbed>
            </div>
          )}
          {between && (
            <div className="ls-between">
              <div className="eb">{sec.name} · {banked[sec.key] && !r.results[sec.key] ? 'argued earlier today, the first result stands' : 'ruling'}</div>
              <div className="ls-bscore">{Math.round(parts[r.si])}<small>/{LAW_CASE_MAX}</small></div>
              {secDone.unknown ? <div className="ls-braw">Result on file</div> : (
                <div className="ls-split">
                  <div><span>Accuracy</span><b>{secDone.score}/{secDone.total}</b><i style={{ width: `${Math.round(100 * lawAcc(secDone.score, secDone.total))}%` }} /></div>
                  <div><span>Speed</span><b>{secDone.secs ? fmtClock(secDone.secs) : 'no clock'}</b><i style={{ width: `${Math.round(100 * lawSpeed(sec.key, secDone.secs))}%` }} /><small>full marks under {fmtClock(LAW_CLOCK[sec.key][0])}</small></div>
                </div>
              )}
              {!last ? (
                <button type="button" className="start" onClick={advance}>Next: Case {String(r.si + 2).padStart(2, '0')}, {sections[r.si + 1].name} <span aria-hidden="true">&rarr;</span></button>
              ) : (
                <div className="ls-rolling" role="status">The committee is reviewing your file<span className="ls-dots" aria-hidden="true"><i /><i /><i /></span></div>
              )}
            </div>
          )}
        </section>
      )}

      {hydrated && done && (
        <Verdict key="verdict" sections={sections} counted={counted} parts={parts} total={total} dateLabel={dateLabel}
          animate={doneAtLoad.current === false} board={board} onShare={copyShare} copied={copied} L={L} />
      )}
    </div>
  );
}

// ─── the school ladder, top to bottom ───────────────────────────────────────
function Ladder({ at, L }) {
  return (
    <ol className="lad">
      {L.map((t, i) => (
        <li key={t[2]} className={at === i ? 'me' : ''} style={{ '--p': t[5], '--s': t[6] }}>
          <span className="lp" aria-hidden="true"><i /></span>
          <span className="ln"><b>{t[1]}</b><small>{t[3]}</small></span>
          <span className="lc">{i === LOW ? 'any score' : `${t[0]}+`}</span>
        </li>
      ))}
    </ol>
  );
}

// The school's placard: its colors as a banner and its full name set in type
// that wraps, so long names ("University of North Carolina School of Law")
// read in full. Owner, 2026-10-08: the pennants could not hold long names.
function Placard({ ti, squash, L }) {
  const t = L[ti];
  const long = t[1].length > 34;
  return (
    <div className={`pn${squash ? ' squash' : ''}`} style={{ '--p': t[5], '--s': t[6] }}>
      <div className="pn-band"><span>Rung {L.length - ti} of {L.length}</span><i /></div>
      <div className="pn-body">
        <div className={`pn-nm${long ? ' long' : ''}`}>{t[1]}</div>
        <div className="pn-city">{t[3]}</div>
      </div>
    </div>
  );
}

// The rung just above: the school that would have taken you with a few more
// points. Owner, 2026-10-08: "something that shows what was one above just
// missed." The bar runs from your rung's cutoff to the next one.
function Missed({ total, ti, L }) {
  if (ti <= 0) return <div className="ms top"><span>Top of the ladder</span><b>No school above Yale.</b></div>;
  const up = L[ti - 1];
  const floor = L[ti][0] && ti < L.length - 1 ? L[ti][0] : 0;
  const short = Math.max(1, up[0] - total);
  const fill = Math.max(4, Math.min(96, 100 * (total - floor) / Math.max(1, up[0] - floor)));
  return (
    <div className="ms" style={{ '--p': up[5], '--s': up[6] }}>
      <div className="ms-hd"><span>Waitlisted</span><em>{short} {short === 1 ? 'point' : 'points'} short</em></div>
      <div className="ms-nm">{up[1]}</div>
      <div className="ms-bar"><i style={{ width: `${fill}%` }} /><b>{up[0]}</b></div>
    </div>
  );
}

// ─── THE VERDICT ────────────────────────────────────────────────────────────
// The transcript grades case by case and the total counts up; the pennant on
// the left starts at the bottom of the ladder and is swapped for the next
// school up each time the running total crosses a cutoff. Then the committee
// stamps the file and the letter slides out of its envelope.
function Verdict({ sections, counted, parts, total, dateLabel, animate, board, onShare, copied, L }) {
  const n = sections.length;
  const max = n * LAW_CASE_MAX;
  const pts = parts.map((p) => Math.round(p));
  const run50 = (v) => Math.round(v);
  const fti = lawTierOf(total);
  const t = L[fti];
  const reduce = useMemo(() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }, []);
  const play = animate && !reduce;
  const [lines, setLines] = useState(play ? 0 : n);
  const [cur, setCur] = useState(play ? 0 : total);
  const [face, setFace] = useState(play ? LOW : fti);
  const [squash, setSquash] = useState(false);
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
          const v = from + (to - from) * k / steps;
          const shown = run50(v);
          setCur(shown);
          const nt = lawTierOf(shown);
          if (nt < ti) {
            ti = nt;
            setSquash(true);
            await sleep(150);
            if (!alive) return;
            setFace(nt); setSquash(false);
            setUpg({ k: `${nt}-${Date.now()}`, text: `Moved up: ${L[nt][2]}` });
            burst(nt <= 1 ? 14 : 8);
          }
          await sleep(45);
        }
        acc = to;
        await sleep(330);
      }
      if (!alive) return;
      setCur(total);
      await sleep(350);
      setPhase('stamp');
      await sleep(1250);
      if (!alive) return;
      setPhase('letter');
      await sleep(1900);
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
  pts.forEach((v, i) => { if (v > pts[hi]) hi = i; if (v < pts[lo]) lo = i; });
  const flat = pts[hi] === pts[lo];
  const settled = phase === 'settled';
  const showLetter = phase === 'letter' || settled;
  const idx = lawIndexOf(cur);

  return (
    <section className="vf">
      <div className="eb">{dateLabel} · Judged</div>
      <div className={`vf-stage${settled ? ' settled' : ''}${phase === 'stamp' ? ' thud' : ''}`}>
        <div className="vf-left">
          {upg && <div key={upg.k} className="vf-upg">{upg.text}</div>}
          <Placard ti={face} squash={squash} L={L} />
          {showLetter && <Missed total={total} ti={fti} L={L} />}
          {sparks.map((p) => <i key={p.id} className="vf-spark" style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--d': `${p.ms}ms` }} />)}
        </div>
        <div className="vf-right">
          {!showLetter && (
            <div className="tr" aria-hidden="true">
              <div className="tr-hd"><span>Official transcript</span><span>Office of Admissions</span></div>
              <div className="tr-lines">
                {sections.slice(0, lines).map((s, i) => (
                  <div key={s.key} className="tr-l">
                    <span className="tr-c">Case {i + 1}</span>
                    <span className="tr-n">{s.name}<small>{counted[i] && !counted[i].unknown ? `${counted[i].score}/${counted[i].total} in ${counted[i].secs ? fmtClock(counted[i].secs) : '?'}` : s.file}</small></span>
                    <b className={pts[i] >= LAW_CASE_MAX - 1 ? 'ten' : ''}>{pts[i]}<small>/{LAW_CASE_MAX}</small></b>
                  </div>
                ))}
              </div>
              <div className="tr-tot">
                <div><span>Run total</span><b>{cur}<small> / {LAW_MAX}</small></b></div>
                <div className="r"><span>Admissions score</span><b>{idx}</b></div>
              </div>
              {phase === 'stamp' && <div className="tr-stamp">Admitted</div>}
            </div>
          )}
          {showLetter && (
            <div className={`env${settled ? ' open done' : ' open'}`} style={{ '--p': t[5], '--s': t[6] }}>
              <div className="env-back" />
              <div className="env-letter">
                <div className="lt-from">Office of Admissions</div>
                <div className="lt-sch">{t[1]}</div>
                <div className="lt-city">{t[3]}</div>
                <p className="lt-body">Dear applicant, after a full review of your file we are pleased to offer you a seat in the entering class.</p>
                <div className="lt-sig"><span>Admissions score</span><b>{lawIndexOf(total)}</b></div>
              </div>
              <div className="env-front" />
              <div className="env-flap" />
              <div className="env-seal">{t[2].slice(0, 1)}</div>
            </div>
          )}
        </div>
      </div>

      {settled && (
        <div className="vf-copy" role="status">
          <div className="vf-you">You got into</div>
          <h1 className="vf-nm">{t[1]}</h1>
          <p className="vf-ln">{t[4]}</p>
          <div className="vf-stats">
            <div><b>{total}/{LAW_MAX}</b><span>Run total</span></div>
            <div><b>{lawIndexOf(total)}</b><span>Admissions score</span></div>
            {me && me.rank ? <div><b>#{me.rank}</b><span>{field ? `of ${Number(field).toLocaleString()} today` : 'today'}</span></div> : null}
          </div>
          <div className="vf-games">
            {sections.map((s, i) => <div key={s.key} className={flat ? '' : i === hi ? 'hi' : i === lo ? 'lo' : ''}><i>{s.name}</i><b>{counted[i] ? pts[i] : '-'}</b></div>)}
          </div>
          <NextDrop label="Tomorrow's docket" sub="Five new cases and a new set of schools at midnight Eastern." href="/judged"
            accent="var(--ls-cta)" ink="var(--ls-ink)" mute="var(--ls-mute)" style={{ margin: '14px 0 0', maxWidth: 420 }} />
          <div className="vf-btns">
            <button type="button" className="pri" onClick={onShare}>{copied ? 'Copied' : 'Share your letter'}</button>
            <a href="/judged/leaderboard">Leaderboard</a>
            <a href="/pricecheck">Play Price Check</a>
            <a href="/">Back to main</a>
          </div>
          <div className="vf-lad"><div className="eb">The ladder</div><Ladder at={fti} L={L} /></div>
        </div>
      )}
    </section>
  );
}

const CSS = `
.ls *{box-sizing:border-box}
.ls .eb{font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ls-mute)}
.ls-cap{display:flex;align-items:center;gap:12px;max-width:820px;margin:0 auto;padding:12px 16px;font-size:13px}
.ls-home{font-family:${MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ls-mute);text-decoration:none}
.ls-cap b{font-weight:900;letter-spacing:-.01em}
.ls-capd{color:var(--ls-mute);font-weight:700}
.ls-capt{display:flex;gap:4px;margin-left:auto}
.ls-capt i{width:18px;height:6px;border-radius:3px;background:var(--ls-line)}
.ls-capt i.on{box-shadow:0 0 0 2px var(--ls-ground),0 0 0 3px var(--ls-ink)}
.ls-lb{margin-left:auto;font-family:${MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ls-cta);text-decoration:none}
/* PREGAME */
.pre{max-width:860px;margin:0 auto;padding:18px 16px 54px;text-align:center}
.title{margin:10px 0 0;font-size:clamp(46px,9vw,80px);font-weight:900;letter-spacing:-.035em;line-height:.95;font-family:${SERIF};font-style:italic}
.title span{display:inline-block;animation:lsdrop .7s cubic-bezier(.2,1.4,.4,1) both}
.title span:nth-child(2){animation-delay:.09s}
@keyframes lsdrop{from{transform:translateY(-40px);opacity:0}to{transform:none;opacity:1}}
.lede{margin:14px auto 0;max-width:560px;font-size:15.5px;font-weight:600;line-height:1.5;color:var(--ls-mute)}
.lede b{color:var(--ls-ink)}
.lede-x{display:block;margin-top:4px;color:var(--ls-gold);font-weight:800}
.gav{display:block;width:100%;max-width:440px;margin:18px auto 0;padding:0;border:1.5px solid var(--ls-line);border-radius:16px;background:var(--ls-panel);color:var(--ls-ink);box-shadow:0 14px 34px rgba(0,0,0,.55);overflow:hidden;cursor:pointer;font:inherit}
.gav .gscr{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 10px 8px}
.gav .gscr small{font:500 9.5px ${MONO};letter-spacing:.16em;text-transform:uppercase;color:var(--ls-mute)}
.gv{width:120px;height:70px;overflow:visible}
.gv-arm{transform-origin:60px 50px;transform:rotate(-24deg);transition:transform .25s cubic-bezier(.6,0,.8,.4)}
.gav:hover .gv-arm{transform:rotate(-30deg)}
.gav.strike .gv-arm,.gav:active .gv-arm{transform:rotate(4deg);transition:transform .12s cubic-bezier(.7,0,1,.6)}
.gav.strike{animation:lsthud .3s .12s ease-out}
@keyframes lsthud{30%{transform:translateY(3px)}}
.gav .gtrig{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px;padding:15px 18px;background:var(--ls-cta);color:var(--ls-cta-ink);font:900 19px ${SANS}}
.gav .gtrig::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transform:translateX(-100%);animation:lssheen 2.6s 1.4s ease-in-out infinite}
@keyframes lssheen{to{transform:translateX(100%)}}
.gav:focus-visible,.pre-how:focus-visible{outline:2px solid var(--ls-ink);outline-offset:3px}
.desk{display:flex;justify-content:center;gap:10px;max-width:820px;margin:34px auto 0;padding:24px 10px 18px;border-radius:18px;background:linear-gradient(180deg,#2a1b10,#1a110a);box-shadow:inset 0 2px 0 rgba(255,255,255,.06),0 18px 40px rgba(0,0,0,.5)}
.fold{flex:1;max-width:150px;position:relative;transform:rotate(var(--r));animation:lsfold .6s cubic-bezier(.2,1.3,.4,1) both}
@keyframes lsfold{from{opacity:0;transform:translateY(60px) rotate(12deg)}to{opacity:1;transform:rotate(var(--r))}}
.ftab{position:relative;display:inline-block;margin-left:10px;padding:4px 10px 3px;border-radius:7px 7px 0 0;background:var(--ls-manila);color:#4a3314;font:800 9.5px ${MONO};letter-spacing:.12em;text-transform:uppercase}
.fbody{background:var(--ls-manila);border-radius:3px 10px 10px 10px;padding:12px 10px 12px;text-align:left;color:#3b2810;box-shadow:0 10px 18px rgba(0,0,0,.45);border-top:4px solid var(--c)}
.fk{font:800 10px ${MONO};letter-spacing:.12em;text-transform:uppercase;color:#7a5a2a}
.fn{font-size:19px;font-weight:900;letter-spacing:-.01em;margin-top:2px}
.fc{font-size:11.5px;font-weight:700;line-height:1.3;margin-top:5px;color:#5a4220}
.fseal{display:inline-block;margin-top:9px;padding:2px 7px;border:2px solid #9b2c2c;border-radius:4px;color:#9b2c2c;font:800 10px ${MONO};letter-spacing:.14em;transform:rotate(-6deg)}
.fbk{margin-top:8px;font-size:10.5px;font-weight:800;color:#2f5d3a}
.pre-row{display:flex;flex-direction:row-reverse;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;max-width:820px;margin:16px auto 0}
.pre-row .sub2{margin:0;text-align:right;max-width:280px}
.pre-how{background:none;border:0;padding:6px 0;color:var(--ls-gold);font:800 13px ${SANS};text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.sub2{margin-top:12px;font-size:12.5px;font-weight:700;color:var(--ls-mute)}
.sub2 a{color:var(--ls-ink)}
.pre-lad{max-width:560px;margin:10px auto 0;animation:lsrise .3s ease both}
.facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0 14px}
.fact{background:var(--ls-panel);border:1.5px solid var(--ls-line);border-radius:12px;padding:9px 10px;text-align:left}
.fact b{display:block;font-size:20px;font-weight:900}
.fact span{font-size:11px;font-weight:700;color:var(--ls-mute);line-height:1.25;display:block}
.pre.leave .fold{animation:lsout .6s cubic-bezier(.6,0,.8,.4) both !important}
.pre.leave .fold:nth-child(2){animation-delay:.05s !important}.pre.leave .fold:nth-child(3){animation-delay:.1s !important}.pre.leave .fold:nth-child(4){animation-delay:.15s !important}.pre.leave .fold:nth-child(5){animation-delay:.2s !important}
@keyframes lsout{to{transform:translateY(-120px) rotate(-8deg);opacity:0}}
.pre.leave .fade{transition:opacity .4s .2s;opacity:0}
/* THE LADDER */
.lad{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;text-align:left}
.lad li{display:flex;align-items:center;gap:12px;padding:7px 10px;border-radius:10px;background:var(--ls-surf);border:1px solid var(--ls-line)}
.lad li.me{border-color:var(--ls-gold);box-shadow:0 0 0 1px var(--ls-gold) inset;background:rgba(233,207,127,.08)}
.lad .lp{flex:none;width:12px;height:30px;border-radius:3px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 0 0 1px rgba(255,255,255,.18)}
.lad .lp::before{content:'';flex:2;background:var(--p)}
.lad .lp i{flex:1;background:var(--s)}
.lad .ln{flex:1;min-width:0;display:flex;flex-direction:column}
.lad .ln b{font-size:13.5px;font-weight:800;line-height:1.25;text-wrap:balance}
.lad .ln small{font-size:11px;color:var(--ls-mute);font-weight:700}
.lad .lc{font:500 12px ${MONO};color:var(--ls-gold);white-space:nowrap}
/* PLAY */
.ls-play{max-width:1180px;margin:0 auto;padding:4px 0 50px}
.ls-sechd{display:flex;align-items:center;gap:10px;max-width:760px;margin:6px auto 0;padding:0 16px;animation:lsrise .4s ease both}
.ls-sectag{font:800 11px ${SANS};letter-spacing:.06em;text-transform:uppercase;color:#0b0f1a;background:var(--c);padding:5px 10px;border-radius:5px}
.ls-sechd b{font-size:20px;font-weight:900;letter-spacing:-.01em}
.ls-run{margin-left:auto;font-family:${MONO};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ls-mute)}
.ls-host{animation:lsrise .45s ease both}
.ls-host .stage-page{min-height:0 !important;background:transparent !important;overflow-x:visible !important}
.ls-between{text-align:center;padding:30px 16px;max-width:560px;margin:0 auto;animation:lsrise .4s ease both}
.ls-bscore{font-size:68px;font-weight:900;letter-spacing:-.04em;margin-top:6px}
.ls-bscore small{font-size:24px;color:var(--ls-mute)}
.ls-braw{color:var(--ls-mute);font-weight:700}
.ls-split{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:420px;margin:12px auto 0;text-align:left}
.ls-split div{position:relative;background:var(--ls-surf);border:1px solid var(--ls-line);border-radius:12px;padding:10px 12px 14px;overflow:hidden}
.ls-split span{display:block;font:800 9.5px ${SANS};letter-spacing:.14em;text-transform:uppercase;color:var(--ls-mute)}
.ls-split b{font:500 22px ${MONO}}
.ls-split small{display:block;font-size:10.5px;font-weight:700;color:var(--ls-mute);margin-top:2px}
.ls-split i{position:absolute;left:0;bottom:0;height:4px;background:var(--ls-gold);border-radius:0 2px 2px 0}
.ls .start{margin:26px auto 0;display:inline-flex;align-items:center;gap:10px;font:900 18px ${SANS};border:0;border-radius:14px;padding:15px 28px;background:var(--ls-cta);color:var(--ls-cta-ink);cursor:pointer;box-shadow:0 14px 34px rgba(0,0,0,.55)}
.ls .start:active{transform:scale(.97)}
.ls-rolling{margin:26px auto 0;display:inline-flex;align-items:center;gap:10px;font:800 15px ${SANS};color:var(--ls-gold)}
.ls-dots{display:inline-flex;gap:5px}
.ls-dots i{width:6px;height:6px;border-radius:50%;background:var(--ls-gold);animation:lsdot 1s ease-in-out infinite}
.ls-dots i:nth-child(2){animation-delay:.15s}.ls-dots i:nth-child(3){animation-delay:.3s}
@keyframes lsdot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
@keyframes lsrise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
/* VERDICT */
.vf{position:relative;max-width:980px;margin:0 auto;padding:14px 16px 70px}
.vf > .eb{text-align:center}
.vf-stage{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:34px;align-items:center;margin-top:22px;min-height:420px}
.vf-stage.thud{animation:lsshake .45s ease-out}
@keyframes lsshake{15%{transform:translate(3px,2px)}30%{transform:translate(-3px,-1px)}45%{transform:translate(2px,-2px)}60%{transform:translate(-1px,1px)}}
.vf-left{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:260px}
.vf-upg{position:absolute;left:50%;top:-6px;font:800 11px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:var(--ls-cta-ink);background:var(--ls-cta);padding:6px 11px;border-radius:999px;white-space:nowrap;z-index:4;animation:vfup 1s ease-out both}
@keyframes vfup{0%{opacity:0;transform:translate(-50%,12px)}20%{opacity:1;transform:translate(-50%,0)}75%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-8px)}}
.vf-spark{position:absolute;left:50%;top:45%;width:6px;height:6px;margin:-3px;border-radius:50%;background:var(--ls-gold);z-index:5;pointer-events:none;animation:vfspark var(--d) cubic-bezier(.2,.7,.3,1) both}
@keyframes vfspark{from{transform:translate(0,0) scale(1);opacity:1}to{transform:translate(var(--x),var(--y)) scale(.2);opacity:0}}
.pn{position:relative;width:min(320px,92%);background:#fffdf7;color:#1f2430;border-radius:8px;overflow:hidden;box-shadow:0 24px 50px -18px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.25);transition:transform .15s ease-in;animation:lsrise .4s ease both}
.pn.squash{transform:rotateX(90deg)}
.pn-band{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--p);color:var(--s);padding:10px 14px 9px;position:relative}
.pn-band span{font:800 10px ${MONO};letter-spacing:.16em;text-transform:uppercase}
.pn-band i{position:absolute;left:0;right:0;bottom:-5px;height:5px;background:var(--s)}
.pn-body{padding:18px 16px 16px;min-height:118px;display:flex;flex-direction:column;justify-content:center}
.pn-nm{font:700 24px/1.15 ${SERIF};text-wrap:balance;overflow-wrap:anywhere}
.pn-nm.long{font-size:20px}
.pn-city{margin-top:6px;font:700 12px ${SANS};color:#7a7360}
.ms{width:min(320px,92%);margin-top:14px;padding:11px 13px 12px;border-radius:10px;background:var(--ls-surf);border:1px dashed var(--ls-line);text-align:left;animation:lsrise .5s .5s ease both}
.ms-hd{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.ms-hd span{font:800 10px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:var(--ls-mute)}
.ms-hd em{font:normal 500 12px ${MONO};color:var(--ls-gold)}
.ms-nm{margin-top:4px;font:700 16px/1.2 ${SERIF};text-wrap:balance}
.ms-bar{position:relative;margin-top:9px;height:8px;border-radius:4px;background:rgba(255,255,255,.08);display:flex;align-items:center}
.ms-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:linear-gradient(90deg,var(--ls-gold),var(--p));box-shadow:0 0 0 1px rgba(255,255,255,.12) inset;animation:msfill 1.1s .7s cubic-bezier(.2,.8,.3,1) both;transform-origin:0 50%}
.ms-bar b{position:absolute;right:-2px;top:-17px;font:500 10px ${MONO};color:var(--ls-mute)}
.ms-bar::after{content:'';position:absolute;right:0;top:-3px;bottom:-3px;width:2px;background:var(--s);border-radius:1px}
@keyframes msfill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.ms.top b{display:block;margin-top:4px;font:700 16px ${SERIF}}
.ms.top span{font:800 10px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:var(--ls-gold)}
.vf-right{position:relative;display:flex;justify-content:center;min-height:380px;align-items:center}
.tr{position:relative;width:min(440px,100%);background:var(--ls-paper);color:#1f2430;border-radius:6px;padding:18px 20px 16px;box-shadow:0 30px 60px -25px rgba(0,0,0,.8);font-family:${SANS};overflow:hidden}
.tr::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 27px,rgba(31,36,48,.06) 27px 28px);pointer-events:none}
.tr-hd{display:flex;justify-content:space-between;font:800 10px ${MONO};letter-spacing:.14em;text-transform:uppercase;color:#7a7360;border-bottom:2px solid #1f2430;padding-bottom:8px;margin-bottom:6px}
.tr-lines{min-height:236px}
.tr-l{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed rgba(31,36,48,.2);animation:lsrise .3s ease both}
.tr-c{font:500 11px ${MONO};color:#7a7360;width:52px}
.tr-n{flex:1;font-weight:900;font-size:16px;display:flex;flex-direction:column}
.tr-n small{font:600 11px ${SANS};color:#7a7360}
.tr-l b{font:500 22px ${MONO}}
.tr-l b small{font-size:12px;color:#7a7360}
.tr-l b.ten{color:#2f6f3a}
.tr-tot{display:flex;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:2px solid #1f2430}
.tr-tot span{display:block;font:800 9.5px ${SANS};letter-spacing:.14em;text-transform:uppercase;color:#7a7360}
.tr-tot b{font:500 30px ${MONO};font-variant-numeric:tabular-nums}
.tr-tot b small{font-size:14px;color:#7a7360}
.tr-tot .r{text-align:right}
.tr-stamp{position:absolute;left:50%;top:44%;font:900 46px ${SANS};letter-spacing:.12em;text-transform:uppercase;color:#b4232a;border:6px solid #b4232a;border-radius:10px;padding:4px 18px;transform:translate(-50%,-50%) rotate(-12deg);mix-blend-mode:multiply;animation:trstamp .45s cubic-bezier(.2,1.6,.4,1) both}
@keyframes trstamp{from{opacity:0;transform:translate(-50%,-50%) rotate(-12deg) scale(2.6)}to{opacity:.9;transform:translate(-50%,-50%) rotate(-12deg) scale(1)}}
.env{position:relative;width:min(420px,100%);aspect-ratio:1.55;margin-top:110px;animation:envin .6s cubic-bezier(.2,1.2,.4,1) both}
@keyframes envin{from{opacity:0;transform:translateY(60px) scale(.9)}to{opacity:1;transform:none}}
.env-back{position:absolute;inset:0;background:#d9cfb6;border-radius:8px}
.env-front{position:absolute;inset:0;border-radius:8px;background:linear-gradient(160deg,#efe7d3,#e2d6b9);clip-path:polygon(0 30%,50% 64%,100% 30%,100% 100%,0 100%);z-index:3;box-shadow:0 30px 60px -25px rgba(0,0,0,.8)}
.env-flap{position:absolute;left:0;right:0;top:0;height:62%;background:linear-gradient(180deg,#e6dcc3,#d7cba9);clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:50% 0;z-index:4;transition:transform .7s cubic-bezier(.4,0,.2,1) .15s}
.env.open .env-flap{transform:rotateX(180deg);z-index:1}
.env-seal{position:absolute;left:50%;top:56%;width:54px;height:54px;margin:-27px;border-radius:50%;background:var(--p);color:var(--s);display:flex;align-items:center;justify-content:center;font:900 24px ${SERIF};z-index:5;box-shadow:0 4px 10px rgba(0,0,0,.35),inset 0 0 0 4px rgba(0,0,0,.18);transition:opacity .3s .2s}
.env.open .env-seal{opacity:0}
.env-letter{position:absolute;left:6%;right:6%;top:6%;bottom:6%;background:#fffdf7;border-radius:4px;z-index:2;padding:14px 16px;color:#1f2430;box-shadow:0 6px 20px rgba(0,0,0,.25);transform:translateY(0);transition:transform .9s cubic-bezier(.3,1.2,.4,1) .75s;border-top:6px solid var(--p)}
.env.open .env-letter{transform:translateY(-62%)}
.env.done .env-letter{transition:none}
.lt-from{font:800 9.5px ${MONO};letter-spacing:.16em;text-transform:uppercase;color:#7a7360}
.lt-sch{font:700 19px/1.15 ${SERIF};margin-top:5px}
.lt-city{font:600 11px ${SANS};color:#7a7360}
.lt-body{margin:8px 0 6px;font:400 13px/1.45 ${SERIF};font-style:italic}
.lt-sig{display:flex;align-items:baseline;justify-content:space-between;border-top:1px solid rgba(31,36,48,.15);padding-top:5px}
.lt-sig span{font:800 9px ${SANS};letter-spacing:.14em;text-transform:uppercase;color:#7a7360}
.lt-sig b{font:500 20px ${MONO};color:var(--p)}
.vf-copy{max-width:560px;margin:8px auto 0;animation:lsrise .6s .1s ease both}
.vf-you{font:800 12px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:var(--ls-gold)}
.vf-nm{font-size:clamp(30px,5vw,46px);font-weight:900;letter-spacing:-.02em;line-height:1.05;margin:8px 0 10px;text-wrap:balance}
.vf-ln{font-size:17px;line-height:1.45;margin:0 0 16px;color:var(--ls-ink)}
.vf-stats{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:8px;margin-bottom:10px}
.vf-stats div{background:var(--ls-surf);border:1px solid var(--ls-line);border-radius:12px;padding:9px 11px;display:flex;flex-direction:column;gap:3px;min-width:0}
.vf-stats b{font:500 20px ${MONO};white-space:nowrap}
.vf-stats span{font:800 9.5px ${SANS};letter-spacing:.12em;text-transform:uppercase;color:var(--ls-mute)}
.vf-games{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.vf-games div{background:var(--ls-surf);border:1px solid var(--ls-line);border-radius:9px;padding:7px 2px;text-align:center;min-width:0}
.vf-games i{display:block;font:normal 800 8.5px ${SANS};letter-spacing:.05em;text-transform:uppercase;color:var(--ls-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vf-games b{font:500 17px ${MONO}}
.vf-games .hi{border-color:var(--ls-gold)}.vf-games .hi b{color:var(--ls-gold)}
.vf-games .lo b{color:var(--ls-bad)}
.vf-next{display:inline-block;margin-top:12px;font-size:13px;font-weight:700;padding:9px 12px;border-radius:10px;background:var(--ls-surf);border:1px solid var(--ls-line)}
.vf-next b{color:var(--ls-gold)}
.vf-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.vf-btns a,.vf-btns button{font:800 14px ${SANS};padding:12px 18px;border-radius:12px;text-decoration:none;color:var(--ls-ink);border:1px solid var(--ls-line);background:transparent;cursor:pointer}
.vf-btns .pri{background:var(--ls-cta);color:var(--ls-cta-ink);border-color:transparent}
.vf-lad{margin-top:26px}
.vf-lad .eb{margin-bottom:8px}
@media(max-width:720px){
.vf-stage{display:flex;flex-direction:column;gap:16px;min-height:0}
.vf-left{min-height:0;padding-top:16px;width:100%}
.pn,.ms{width:100%;max-width:420px;flex:none}
.vf-right{min-height:0;width:100%}
.env{margin-top:150px}
.vf-btns a,.vf-btns button{flex:1 1 40%;text-align:center;padding:12px 10px}
}
@media(max-width:600px){.fbk-x{display:none}.desk{gap:5px;padding:18px 6px 14px}.fbody{padding:9px 6px}.fn{font-size:13px}.fc{display:none}.fk{font-size:8px;letter-spacing:.06em}.ftab{margin-left:4px;padding:3px 5px 2px;font-size:8px;letter-spacing:.04em}.fseal{font-size:8px;padding:1px 4px}.fbk{font-size:9px}.title{font-size:48px}.lede{font-size:14px}.pre-row .sub2{font-size:11.5px;max-width:200px}.facts{gap:5px}.fact{padding:7px}.fact b{font-size:16px}.fact span{font-size:9.5px}.ls-sechd b{font-size:16px}}
@media(prefers-reduced-motion:reduce){.ls *{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition:none !important}}
`;
