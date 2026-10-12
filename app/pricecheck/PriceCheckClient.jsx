'use client';

// PRICE CHECK — the five price games as one run (owner, 2026-10-01).
//
// Pricer, Dealer, Realtor, Agent and Curator back to back, three guesses at
// each, one score out of 50. Each game is played by its own engine
// (app/price/PriceGame.jsx, `run` mode) and files its own solo row, so the run
// leaves exactly what five separate plays would. The circuit board
// (lib/circuits 'pricecheck', score: 'correct') adds those five rows up.
//
// A GAME ALREADY PLAYED TODAY on its own page is still offered in the run,
// as practice: the player guesses again, nothing is posted, and the run
// counts the FIRST score, the one on the leaderboard (owner, 2026-10-01).
//
// THE PREGAME is the approved mockup: tags hanging on a rail, a price-gun
// odometer that never lands, Start with a sheen. THE ENDING is the card
// ladder (owner, 2026-10-01, "not a receipt"): the scores ring up on a card
// terminal, the card in hand upgrades from prepaid to black as the total
// climbs, then taps to pay and the result takes the terminal's place. The
// persona is one of THE SHOPPERS (RUN_RANKS in lib/price-games). Ten seconds later the five items come up in one pop-up
// (Pricer's reveal, kept), ON WHATEVER PAGE THE PLAYER IS ON BY THEN (owner,
// 2026-10-02): see app/pricecheck/ItemsPop.jsx. Once it is closed, the Trivia Gauntlet offer follows
// ten seconds later, or as soon as the player leaves the page, if that run has
// not been finished today (owner, 2026-10-01: slow the pop-ups down).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import PriceGame, { readDoneSave } from '../price/PriceGame';
import MoreRunsPop, { MoreRunsList } from '../circuits/MoreRuns';
import NextDrop from '../NextDrop';
import ItemsPop, { itemsFor, scheduleItems, spendItems } from './ItemsPop';
import useCircuitBoard from '../circuits/useCircuitBoard';
import { withRef } from '@/lib/referrals';
import { isMobileDevice } from '@/lib/is-mobile';
import ChallengeStrip from '../ChallengeStrip';
import { RunChallengeButton, RunChallengeLine, runToken } from '../RunChallenge';
import { PRICE_GAMES, fmtCents, errOf, scoreOf, pctLabel, runRankOf, runTierOf, ranksFor, isV2, scoreGuesses } from '@/lib/price-games';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const RUN_ID = 'pricecheck';

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
const freshRun = () => ({ v: 1, rule: 2, phase: 'idle', si: 0, t0: null, results: {} });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The first (counted) play of a game today, read off its own solo save.
function bankedOf(sec) {
  const s = readDoneSave(sec.key, sec.num, sec.quizId);
  if (!s || !s.guesses.length) return null;
  const sg = scoreGuesses(s.guesses, sec.day.price, sec.quizId);
  return { score: sg.score, at: sg.at, best: sg.at >= 0 ? s.guesses[sg.at] : null, first: s.guesses[0], guesses: s.guesses.length, secs: s.t0 && s.tEnd ? Math.round((s.tEnd - s.t0) / 1000) : 0, banked: true };
}

export default function PriceCheckClient({ dateLabel, dateShort, sections = [] }) {
  const N = sections.length;
  const MAX = N * 10;
  const V2 = isV2(sections[0] && sections[0].quizId);
  const RANKS = ranksFor(sections[0] && sections[0].quizId);
  const STORE = `sot_run_${RUN_ID}_${etToday()}`;
  // One register, the Trivia Gauntlet's (owner, 2026-10-01: match the
  // Gauntlet): Midnight ground, translucent white surfaces, sky call to action.
  const theme = 'dark';
  const dark = true;
  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [leaving, setLeaving] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [between, setBetween] = useState(null);
  const doneAtLoad = useRef(null);
  const [showItems, setShowItems] = useState(false);
  const [itemAt, setItemAt] = useState(0);
  const [nudge, setNudge] = useState(false);
  const itemsShown = useRef(false);
  const countedRef = useRef([]);
  const [copied, setCopied] = useState(false);

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
    // A run begun under the five-guess rule on a three-guess day is dropped
    // (2026-10-11 reset), so the player replays it under the new rule.
    if (saved && saved.v === 1 && (!V2 || saved.rule === 2)) {
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
  const board = useCircuitBoard(RUN_ID, hydrated && done);

  // What counts for each tag: the first play of the day, wherever it happened.
  const counted = useMemo(() => sections.map((sec) => {
    const b = banked[sec.key];
    const res = r.results[sec.key];
    if (b) return { ...b, practiceScore: res && res.practice ? res.score : null };
    if (res) return res;
    return null;
  }), [sections, banked, r.results]);
  countedRef.current = counted;
  const total = counted.reduce((a, c) => a + (c ? c.score : 0), 0);
  const rank = runRankOf(Math.round(total * 50 / Math.max(1, MAX)), RANKS);

  function start() {
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      commit({ ...rRef.current, phase: 'playing', si: 0, t0: rRef.current.t0 || Date.now() });
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    }, 620);
  }

  function onSectionDone(res) {
    const cur = rRef.current;
    const sec = sections[cur.si];
    if (!sec || res.key !== sec.key) return;
    const sg = scoreGuesses(res.guesses, sec.day.price, sec.quizId);
    const best = sg.at >= 0 ? res.guesses[sg.at] : null;
    const results = { ...cur.results, [sec.key]: { score: res.score, at: sg.at, best, first: res.guesses[0] ?? null, guesses: res.guesses.length, secs: res.secs, practice: !!res.practice } };
    const last = cur.si >= N - 1;
    const next = { ...cur, results };
    commit(next);
    setBetween({ si: cur.si, last });
  }
  // THE LAST TAG ROLLS STRAIGHT INTO THE FINALE (owner, 2026-10-01): no
  // "Final prices" press. The last score and price hold for a beat so the
  // player sees them, then the ending starts on its own.
  const FINALE_BEAT = 1800;
  useEffect(() => {
    if (!between || !between.last) return undefined;
    const t = setTimeout(() => advance(), FINALE_BEAT);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [between]);
  function advance() {
    const cur = rRef.current;
    setBetween(null);
    if (cur.si >= N - 1) commit({ ...cur, phase: 'done', tEnd: Date.now() });
    else commit({ ...cur, si: cur.si + 1 });
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }

  // The items pop-up: ten seconds after the ending settles, once, and only for
  // a run finished in this sitting. Stamped rather than timed here, so it opens
  // wherever the player has gone (PriceCheckItemsGlobal in app/layout.js).
  const finaleOver = useCallback(() => {
    if (itemsShown.current) return;
    itemsShown.current = true;
    scheduleItems(itemsFor(sections, countedRef.current));
  }, [sections]);
  function closeItems() { setShowItems(false); setNudge(true); }

  function shareText() {
    const per = sections.map((s, i) => `${s.name} ${counted[i] ? counted[i].score : '-'}`).join(' · ');
    const code = sections.map((s, i) => (counted[i] ? counted[i].score : 0)).join('-');
    return `Price Check · ${dateShort} · ${total}/${MAX}\nI paid with the ${rank[3]} card: ${rank[1]}.\n${per}\n${withRef(`mindloftdaily.com/pricecheck?s=${code}${V2 ? '&r=2' : ''}`)}`;
  }
  function copyShare() {
    const text = done ? shareText() : `Price Check: five real prices, from Amazon to the auction block. Three guesses at each, and the first one counts most.\n${withRef('mindloftdaily.com/pricecheck')}`;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const tagCol = (key) => (dark ? PRICE_GAMES[key].tagDark : PRICE_GAMES[key].tagLight);
  const VARS = { '--pc-ground': '#0b0f1a', '--pc-panel': '#0d1220', '--pc-surf': 'rgba(255,255,255,.045)', '--pc-line': 'rgba(255,255,255,.12)', '--pc-ink': '#e9edf4', '--pc-mute': '#9aa8c4', '--pc-rail': '#2a3247', '--pc-shadow': '0 14px 34px rgba(0,0,0,.55)', '--pc-cta': '#7dd3fc', '--pc-cta-ink': '#08222e', '--pc-hi': '#7dd3fc', '--pc-good': '#6ee7b7', '--pc-bad': '#fb7185', '--pc-mat': '#ffffff' };
  sections.forEach((s) => { VARS[`--pc-${s.key}`] = tagCol(s.key); });

  const sec = playing ? sections[r.si] : null;
  const secBanked = sec ? banked[sec.key] : null;

  return (
    <div className="stage-page pc" data-stage-theme={theme} style={{ ...VARS, minHeight: '100vh', background: 'var(--pc-ground)', color: 'var(--pc-ink)', fontFamily: SANS, overflowX: 'hidden', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {done ? null : <ChallengeStrip gameKey="pricecheck" num={runToken()} run />}
      <div className="pc-cap">
        <Link href="/" className="pc-home">Mind Loft</Link>
        <b>Price Check</b>
        <span className="pc-capd">{dateShort}</span>
        {playing && <span className="pc-capt">{sections.map((s, i) => <i key={s.key} className={i < r.si ? 'd' : i === r.si ? 'on' : ''} style={{ background: i <= r.si ? `var(--pc-${s.key})` : undefined }} title={s.name} />)}</span>}
        {!playing && <a className="pc-lb" href="/pricecheck/leaderboard">Leaderboard</a>}
      </div>

      {hydrated && r.phase === 'idle' && (
        <section className={`pre${leaving ? ' leave' : ''}`}>
          <div className="eb fade">{dateLabel} · Price Check</div>
          <h1 className="title"><span>Price</span> <span>Check</span></h1>
          <p className="lede fade">Five real price tags, from <b>pocket change</b> to <b>the auction block</b>. {V2 ? <>Three guesses at each, and <b>the first one counts most</b>.<span className="lede-x"> Trust your gut.</span></> : <>Five guesses at each.<span className="lede-x"> Get warm, get close, then go big.</span></>}</p>
          {/* THE PRICE GUN IS THE START BUTTON (owner, 2026-10-01, option C): the
              odometer that never lands is the gun's screen and Start is its trigger,
              straight under the title, so it is on screen on every phone. */}
          <button type="button" className="gun fade" onClick={start} aria-label="Start the run">
            <span className="gscr"><small>Today&rsquo;s register</small>
              <span className="odo" aria-hidden="true"><span className="q">$</span>
                {['1234567890', '7391582640', '4086291537', ',', '9502738164', '2618407395', '5173094826'].map((d, i) => (
                  d === ',' ? <span key={i} className="q">,</span>
                    : <span key={i} className="d"><i style={{ animationDuration: `${[1.6, 1.1, 0.8, 0, 0.6, 0.45, 0.35][i]}s` }}>{d.split('').map((c, j) => <b key={j}>{c}</b>)}</i></span>
                ))}
              </span>
            </span>
            <span className="gtrig">Start the run <span aria-hidden="true">&rarr;</span></span>
          </button>
          <div className="rail" />
          <div className="tags">
            {sections.map((s, i) => (
              <div key={s.key} className="hang" style={{ animationDelay: `${0.25 + i * 0.12}s, ${0.9 + i * 0.15}s`, animationDuration: `.6s, ${3.3 + (i % 3) * 0.3}s` }}>
                <div className="string" />
                <div className="tag" style={{ '--c': `var(--pc-${s.key})` }}>
                  <div className="k"><span className="kn">{String(i + 1).padStart(2, '0')} · </span>{s.name}</div>
                  <div className="n">{s.word}</div>
                  <div className="chip">{s.chip}</div>
                  <div className="pq"><em>$$$</em></div>
                  {banked[s.key] && <div className="bk">Played: {banked[s.key].score}/10 counts</div>}
                </div>
              </div>
            ))}
          </div>
          <div className="pre-row fade">
            <div className="sub2">Played one today? Replay it here; your first score counts.</div>
            <button type="button" className="pre-how" aria-expanded={howOpen} onClick={() => setHowOpen((v) => !v)}>{howOpen ? 'Hide scoring' : 'How scoring works'}</button>
          </div>
          {howOpen && (
            <div className="pre-hw">
              <div className="facts">
                <div className="fact"><b>{N}</b><span>price tags</span></div>
                <div className="fact"><b>{V2 ? 3 : 5}</b><span>guesses each</span></div>
                <div className="fact"><b>{MAX}</b><span>points to win</span></div>
                <div className="fact"><b>1%</b><span>is a bullseye</span></div>
              </div>
              {V2 && <div className="sub2">Your first guess can earn the full 10. The second is capped at 6, the third at 3, and the best one counts.</div>}
              <div className="heat"><div className="bar" /><div className="lbl"><span>Freezing</span><span>Cold</span><span>Warm</span><span>Hot</span><span>Burning</span><span>Bullseye</span></div></div>
            </div>
          )}
          <div className="sub2 fade">Each one is also its own daily: {sections.map((s, i) => <React.Fragment key={s.key}>{i ? ' · ' : ''}<a href={s.path}>{s.name}</a></React.Fragment>)}</div>
        </section>
      )}

      {hydrated && playing && sec && (
        <section className="pc-play" style={{ '--stg-acc': `var(--pc-${sec.key})`, '--stg-acc-ink': `var(--pc-${sec.key})`, '--stg-onramp': dark ? '#0b0f1a' : '#ffffff' }}>
          <div className="pc-sechd">
            <span className="pc-sectag" style={{ background: `var(--pc-${sec.key})` }}>{String(r.si + 1).padStart(2, '0')} · {sec.name}</span>
            <b>{sec.word}</b>
            <span className="pc-run">Run total {sections.slice(0, r.si).reduce((a, s, i) => a + (counted[i] ? counted[i].score : 0), 0)}</span>
          </div>
          {secBanked && (
            <div className="pc-banked">You played {sec.name} today and scored <b>{secBanked.score}/10</b>. That score counts. Guess again for fun.</div>
          )}
          {!between && (
            <PriceGame key={`${sec.key}-${r.si}`} game={sec.key} puzzles={sec.puzzles} dayByNum={{ [sec.num]: sec.day }} forceNum={sec.num}
              run={{ practice: !!secBanked, onDone: onSectionDone }} />
          )}
          {between && (
            <div className="pc-between">
              <div className="eb">{sec.name} · {secBanked ? 'counted score' : 'your score'}</div>
              <div className="pc-bscore">{counted[r.si] ? counted[r.si].score : 0}<small>/10</small></div>
              <div className="pc-bprice">The price was <b>{fmtCents(sec.day.price)}</b>{counted[r.si] && counted[r.si].best ? (V2 && counted[r.si].at >= 0 ? <>, earned on guess {counted[r.si].at + 1} at <b>{fmtCents(counted[r.si].best)}</b></> : <>, your closest <b>{fmtCents(counted[r.si].best)}</b></>) : null}.</div>
              {!between.last ? (
                <button type="button" className="start" onClick={advance}>Next: {sections[r.si + 1].name}, {sections[r.si + 1].word.toLowerCase()} <span aria-hidden="true">&rarr;</span></button>
              ) : (
                <div className="pc-rolling" role="status">Ringing up your final prices<span className="pc-dots" aria-hidden="true"><i /><i /><i /></span></div>
              )}
            </div>
          )}
        </section>
      )}

      {hydrated && done && (
        <Finale key="finale" sections={sections} counted={counted} total={total} max={MAX} dateLabel={dateLabel} dateShort={dateShort}
          animate={doneAtLoad.current === false} onOver={finaleOver} board={board} ranks={RANKS} v2={V2}
          onShare={copyShare} copied={copied} onItems={() => { spendItems(); setItemAt(0); setShowItems(true); }} />
      )}

      {showItems && (
        <ItemsPop items={itemsFor(sections, counted)} at={itemAt} setAt={setItemAt} onClose={closeItems} closeLabel="Back to your results" />
      )}
      <MoreRunsPop self="pricecheck" ready={nudge} delay={10000} fireOnLeave />
    </div>
  );
}

// ─── THE FINALE: the card climbs, then taps (owner, 2026-10-01) ─────────────
// The five scores ring up on a card terminal and the total counts. The card in
// hand starts as the prepaid rack card and is swapped for the next card up each
// time the total crosses a RUN_RANKS cutoff (prepaid, debit, credit, gold,
// black). Then it taps the reader: APPROVED with the persona, or DECLINED on
// the prepaid card. The terminal gives way to the result. No receipt.
const WAVE = (
  <svg viewBox="0 0 22 22" aria-hidden="true"><path d="M7 6c2 3 2 7 0 10M11 4c3 4 3 10 0 14M15 2c4 5 4 13 0 18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
);

function PayCard({ ti, n, max, dateShort, squash, shine, ranks }) {
  const t = ranks[ti];
  const brand = <div className="pk-brand">Mind Loft<small>Price Check</small></div>;
  const kind = <div className="pk-kind">{t[3]}{t[4] ? <small>{t[4]}</small> : null}</div>;
  const num = <div className="pk-num"><span>{n}</span><small> / {max}</small></div>;
  const prepaid = ti === ranks.length - 1;
  return (
    <div className={`pk pk${ti}${squash ? ' squash' : ''}${shine ? ' shine' : ''}`}>
      {prepaid && <div className="pk-peg" />}
      <div className="pk-top">{brand}{kind}</div>
      {prepaid
        ? <div className="pk-mid"><div className="pk-chip silver" /><div className="pk-bal">Balance<b>$0.00</b></div></div>
        : <div className="pk-mid"><div className={`pk-chip${ti === 3 ? ' silver' : ''}`} /><span className="pk-wave">{WAVE}</span></div>}
      <div className="pk-tier">{t[1]}</div>
      <div className="pk-bot">
        {num}
        <div className="pk-br">
          <div className="pk-since">{prepaid ? 'Valid thru' : 'Member since'}<b>{dateShort}</b></div>
          {!prepaid && (ti === 3 ? <div className="pk-debit">DEBIT</div> : <div className="pk-mark" aria-hidden="true"><i /><i /></div>)}
        </div>
      </div>
    </div>
  );
}

// NEXT SHELF, one line (owner, 2026-10-12, layout A): the countdown to the
// next Eastern midnight, read in an effect so server and client agree.
function msToEtMidnight() {
  try {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const g = (k) => Number((p.find((x) => x.type === k) || {}).value || 0);
    return Math.max(0, ((24 - g('hour')) * 3600 - g('minute') * 60 - g('second')) * 1000);
  } catch (e) { return null; }
}
function ShelfIn() {
  const [ms, setMs] = useState(null);
  useEffect(() => {
    const tick = () => setMs(msToEtMidnight());
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, []);
  if (ms == null) return null;
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60);
  return <span className="cf-shelf">Next shelf in <b>{String(h).padStart(2, '0')}h {String(m % 60).padStart(2, '0')}m</b></span>;
}

function Finale({ sections, counted, total, max, dateLabel, dateShort, animate, onOver, board, onShare, copied, onItems, ranks, v2 }) {
  const RUN_RANKS = ranks;
  const pts = sections.map((s, i) => (counted[i] ? counted[i].score : 0));
  const tierAt = (v) => runTierOf(Math.round(v * 50 / Math.max(1, max)), RUN_RANKS);
  const LOW = RUN_RANKS.length - 1;
  const fti = tierAt(total);
  const t = RUN_RANKS[fti];
  const reduce = useMemo(() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }, []);
  const play = animate && !reduce;
  const [lines, setLines] = useState(play ? 0 : sections.length);
  const [cur, setCur] = useState(play ? 0 : total);
  const [face, setFace] = useState(play ? LOW : fti);
  const [squash, setSquash] = useState(false);
  const [upg, setUpg] = useState(null);
  const [phase, setPhase] = useState(play ? 'ring' : 'settled');
  const [tap, setTap] = useState(null);
  const [shine, setShine] = useState(0);
  const [sparks, setSparks] = useState([]);
  const cwRef = useRef(null);
  const readerRef = useRef(null);

  function burst(n) {
    const id = Date.now();
    const list = Array.from({ length: n }, (_, i) => {
      const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 110;
      return { id: `${id}-${i}`, x: Math.cos(a) * d, y: Math.sin(a) * d, ms: 900 + Math.random() * 500 };
    });
    setSparks((s) => [...s, ...list]);
    setTimeout(() => setSparks((s) => s.filter((p) => !list.includes(p))), 1600);
  }

  useEffect(() => {
    if (!play) { if (animate) onOver(); return undefined; }
    let alive = true;
    (async () => {
      await sleep(500);
      let c = 0, ti = LOW;
      for (let i = 0; i < pts.length; i++) {
        if (!alive) return;
        setLines(i + 1);
        const from = c, to = c + pts[i], steps = Math.max(1, pts[i]);
        for (let k = 1; k <= steps; k++) {
          if (!alive) return;
          c = Math.round(from + (to - from) * k / steps);
          setCur(c);
          const nt = tierAt(c);
          if (nt < ti) {
            ti = nt;
            setSquash(true);
            await sleep(140);
            if (!alive) return;
            setFace(nt); setSquash(false);
            setUpg({ k: `${nt}-${Date.now()}`, text: `Upgraded to ${RUN_RANKS[nt][3]}` });
            burst(nt <= 1 ? 14 : 8);
          }
          await sleep(40);
        }
        await sleep(320);
      }
      if (!alive) return;
      setPhase('tap');
      await sleep(450);
      try {
        const a = cwRef.current.getBoundingClientRect(), b = readerRef.current.getBoundingClientRect();
        setTap({ x: (b.left + b.width / 2) - (a.left + a.width / 2), y: (b.top + b.height / 2) - (a.top + a.height / 2) });
      } catch (e) {}
      await sleep(850);
      if (!alive) return;
      setPhase('paid');
      await sleep(1100);
      if (!alive) return;
      setTap(null);
      await sleep(450);
      if (!alive) return;
      setPhase('settled');
      setShine((s) => s + 1);
      if (fti <= 1) burst(20);
      onOver();
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const me = board && board.data && board.data.me;
  const field = board && board.data && Array.isArray(board.data.overall) ? (board.data.uniquePlayers || board.data.overall.length) : null;
  let hi = 0, lo = 0;
  pts.forEach((v, i) => { if (v > pts[hi]) hi = i; if (v < pts[lo]) lo = i; });
  const flat = pts[hi] === pts[lo];
  const declined = fti === LOW;
  const settled = phase === 'settled';

  return (
    <section className="pf">
      <div className="eb">{dateLabel} · Price Check</div>
      <div className={`cf-stage${settled ? ' settled' : ''}`}>
        <div className="cf-cardcol">
          {upg && <div key={upg.k} className="cf-upg">{upg.text}</div>}
          <div className="cf-cw" ref={cwRef} style={tap ? { transform: `translate(${tap.x}px,${tap.y}px) scale(.42) rotate(-10deg)` } : undefined}>
            <PayCard key={`pk${shine}`} ti={face} n={cur} max={max} dateShort={dateShort} squash={squash} shine={shine} ranks={RUN_RANKS} />
          </div>
          {sparks.map((p) => <i key={p.id} className="cf-spark" style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--d': `${p.ms}ms` }} />)}
        </div>
        <div className="cf-right">
          <div className={`cf-term${settled ? ' gone' : ''}`} aria-hidden="true">
            <div className="cf-tap" ref={readerRef}>{WAVE}{phase === 'tap' && <><i /><i className="r2" /><i className="r3" /></>}</div>
            <div className={`cf-scr${phase === 'paid' || settled ? (declined ? ' no' : ' ok') : ''}`}>
              {phase === 'ring' && (
                <>
                  <div className="cf-hd"><span>Price Check</span><span>{dateShort}</span></div>
                  <div className="cf-lines">
                    {sections.slice(0, lines).map((s, i) => <div key={s.key} className="cf-lr"><span>{s.name}</span><b className={pts[i] === 10 ? 'ten' : ''}>{pts[i]}</b></div>)}
                  </div>
                  <div className="cf-tot"><span>TOTAL</span><b>{cur}<small> / {max}</small></b></div>
                </>
              )}
              {phase === 'tap' && <div className="cf-msg"><div className="sm">Tap to pay</div><div className="big">{total} / {max}</div></div>}
              {(phase === 'paid' || settled) && (
                declined
                  ? <div className="cf-msg"><div className="big">DECLINED</div><div className="sm">Balance $0.00</div><div className="who">{t[1]}</div></div>
                  : <div className="cf-msg"><div className="big">APPROVED</div><div className="sm">{t[3]} card</div><div className="who">{t[1]}</div></div>
              )}
            </div>
            <div className="cf-keys">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div>
          </div>
          <div className={`cf-copy${settled ? ' on' : ''}`} role="status">
            {settled && (
              <>
                <div className="cf-you">Your card today</div>
                <h1 className="cf-nm">{t[1]}</h1>
                <p className="cf-ln">{t[2]}</p>
                {/* LAYOUT A (owner, 2026-10-12): the three stat tiles are one line,
                    the upgrade and the next drop are one row of pills, and the five
                    game tiles moved into the scoreboard below as the player's own row. */}
                <div className="cf-sl">
                  <span><b>{total}</b> of {max}</span>
                  {me && me.rank ? <span><b>#{me.rank}</b> {field ? `of ${Number(field).toLocaleString()} today` : 'today'}</span> : null}
                  {v2
                    ? <span><b>{counted.filter((c) => c && c.at === 0).length}</b> of {sections.length} first-guess scores</span>
                    : <span><b>{t[3]}</b> card</span>}
                </div>
                <div className="cf-pills">
                  {fti > 0
                    ? <span className="cf-next"><b>{Math.max(1, Math.ceil(RUN_RANKS[fti - 1][0] * max / 50) - total)} more</b> and you upgrade to {RUN_RANKS[fti - 1][3]}</span>
                    : <span className="cf-next">Top of the ladder. <b>Black card.</b></span>}
                  <ShelfIn />
                </div>
                {!v2 && (
                  <div className="cf-games">
                    {sections.map((s, i) => <div key={s.key} className={flat ? '' : i === hi ? 'hi' : i === lo ? 'lo' : ''}><i>{s.name}</i><b>{pts[i]}</b></div>)}
                  </div>
                )}
                <RunChallengeLine gameKey="pricecheck" score={total} n={runToken()} />
                <div className="pf-btns">
                  <RunChallengeButton gameKey="pricecheck" score={total} total={max} n={runToken()} status={`${t[3]} card`} />
                  <button type="button" onClick={onItems}>See the items</button>
                  <button type="button" className="pri" onClick={onShare}>{copied ? 'Copied' : 'Share card'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {settled && v2 && <FieldPanel sections={sections} counted={counted} total={total} max={max} board={board} ranks={RUN_RANKS} />}
      {settled && (
        <div className="pf-foot">
          <MoreRunsList self="pricecheck" />
          <div className="pf-links"><a href="/pricecheck/leaderboard">Leaderboard</a><a href="/">Back to main</a></div>
        </div>
      )}
    </section>
  );
}


// ─── THE FIELD (owner, 2026-10-11) ──────────────────────────────────────────
// Under the settled card: where the whole field paid on the ladder (worst on
// the left, best on the right, you marked), the top five game by game with how
// far off each first guess was and which guess earned the score, and how the
// field did on each item. Every figure comes off the circuit board payload
// (priceField and the overall rows); nothing here is stored or scored.
const CARD_COL = [['#1e1e23', '#e9cf7f'], ['#e6b532', '#2a1f04'], ['#2f6fe4', '#ffffff'], ['#4b5a6e', '#e7edf4'], ['#fbfaf6', '#22252b']];
const offLabel = (bps) => (typeof bps === 'number' ? pctLabel(bps / 10000) : '');
// The short form for a table cell: a percentage that never runs past four
// characters, so a wild first guess cannot widen the row.
const offShort = (bps) => { if (typeof bps !== 'number') return ''; const p = bps / 100; if (p < 0.1) return 'dead on'; if (p >= 999.5) return '999%+ off'; return `${p < 10 ? Math.round(p * 10) / 10 : Math.round(p)}% off`; };
// Which guess earned a leader's score, read off the score and the first
// guess's error: the first guess earned it if it alone scores that much, a
// score over 3 can only be the second guess, and the rest is the last guess.
function earnedAt(p) {
  if (!p || !p.score) return -1;
  if (typeof p.bps === 'number' && Math.min(scoreOf(p.bps / 10000), 10) === p.score) return 0;
  if (p.score > 3) return 1;
  return Math.max(1, Math.min(2, (p.guessesUsed || 3) - 1));
}

function FieldPanel({ sections, counted, total, max, board, ranks }) {
  const data = board && board.data;
  const pf = data && data.priceField;
  if (!data) return <div className="fp"><div className="fp-wait">Loading the field<span className="pc-dots" aria-hidden="true"><i /><i /><i /></span></div></div>;
  const scale = (v) => Math.round(v * 50 / Math.max(1, max));
  const totals = (pf && pf.totals) || [];
  const counts = ranks.map(() => 0);
  totals.forEach((v) => { counts[runTierOf(scale(v), ranks)] += 1; });
  const sum = counts.reduce((a, b) => a + b, 0);
  const ORD = ranks.map((_, i) => ranks.length - 1 - i); // worst on the left
  const myTi = runTierOf(scale(total), ranks);
  let pos = null;
  if (sum) {
    let before = 0;
    for (const i of ORD) { if (i === myTi) break; before += counts[i]; }
    const lo = ranks[myTi][0], hi = myTi > 0 ? ranks[myTi - 1][0] - 1 : 50;
    const frac = hi > lo ? (scale(total) - lo + 0.5) / (hi - lo + 1) : 0.5;
    pos = ((before + Math.max(counts[myTi], 0.0001) * Math.min(1, Math.max(0, frac))) / sum) * 100;
    pos = Math.min(97, Math.max(3, pos));
  }
  const leaders = (data.overall || []).slice(0, 5).map((L, i) => ({ ...L, _rk: L.rank || i + 1 }));
  // THE PLAYER'S OWN ROW (owner, 2026-10-12, layout A): the five game tiles
  // that sat beside the card are this row now. A player in the top five is
  // highlighted where they stand; anyone else is pinned above the leaders,
  // built from their own counted plays so a guest gets a row too.
  const myKey = data.me && data.me.userKey;
  const inTop = !!myKey && leaders.some((L) => L.userKey === myKey);
  const minePer = {};
  sections.forEach((s, i) => {
    const c = counted[i];
    if (!c) { minePer[s.key] = null; return; }
    const first = typeof c.first === 'number' ? c.first : (Array.isArray(c.guesses) ? c.guesses[0] : null);
    minePer[s.key] = {
      score: c.score,
      at: typeof c.at === 'number' ? c.at : undefined,
      bps: typeof first === 'number' ? Math.round(errOf(first, s.day.price) * 10000) : undefined,
      guessesUsed: Array.isArray(c.guesses) ? c.guesses.length : (typeof c.guesses === 'number' ? c.guesses : undefined),
    };
  });
  const mineRow = { userKey: myKey || '__me', _rk: (data.me && data.me.rank) || '-', username: (data.me && data.me.username) || 'You', total, perGame: minePer, _mine: true };
  const rows = inTop ? leaders : [mineRow, ...leaders];
  const isMine = (L) => L._mine || (!!myKey && L.userKey === myKey);
  const per = (pf && pf.games) || {};
  const avgs = sections.map((s) => (per[s.key] && per[s.key].plays ? per[s.key].avg : null));
  let tough = -1;
  avgs.forEach((a, i) => { if (a != null && (tough < 0 || a < avgs[tough])) tough = i; });
  const cell = (p) => {
    if (!p) return <div className="fp-cell"><b>-</b></div>;
    const g = typeof p.at === 'number' && p.at >= 0 ? p.at : earnedAt(p);
    return (
      <div className={`fp-cell g${g + 1}${p.score === 10 ? ' ten' : ''}`}>
        <b>{p.score}</b>
        {typeof p.bps === 'number' && <span>{offShort(p.bps)}</span>}
        <span className="gp">{[0, 1, 2].map((k) => <i key={k} className={k === g ? 'h' : k < (p.guessesUsed || 0) ? 'u' : ''} />)}</span>
      </div>
    );
  };
  return (
    <div className="fp">
      {rows.length > 0 && (
        <>
          <div className="fp-bh"><h3>Today&rsquo;s scoreboard</h3><a href="/pricecheck/leaderboard">Full leaderboard</a></div>
          <div className="fp-lb">
            <table className="fp-t" aria-label="Today's leaders, game by game">
              <thead><tr><th>#</th><th>Player</th>{sections.map((s) => <th key={s.key}><i style={{ background: `var(--pc-${s.key})` }} />{s.name}</th>)}<th>Total</th></tr></thead>
              <tbody>
                {rows.map((L, i) => {
                  const ti = runTierOf(scale(L.total || 0), ranks);
                  const mine = isMine(L);
                  return (
                    <tr key={L.userKey || i} className={mine ? 'me' : ''} style={{ animationDelay: `${i * 0.1}s` }}>
                      <td>{L._rk}</td>
                      <td className="fp-nm"><span className="cc" style={{ background: CARD_COL[ti][0] }} />{L.username}{mine && L.username !== 'You' && <em className="fp-you">You</em>}</td>
                      {sections.map((s) => <td key={s.key}>{cell(L.perGame && L.perGame[s.key])}</td>)}
                      <td className="fp-tot">{Math.round(L.total || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="fp-ml" aria-hidden="true">
            {rows.map((L, i) => {
              const ti = runTierOf(scale(L.total || 0), ranks);
              const mine = isMine(L);
              return (
                <div key={L.userKey || i} className={`fp-mr${mine ? ' me' : ''}`} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="fp-mh"><b>{L._rk}</b><span className="cc" style={{ background: CARD_COL[ti][0] }} /><span className="fp-mn">{L.username}{mine && L.username !== 'You' && <em className="fp-you">You</em>}</span><span className="fp-mt">{Math.round(L.total || 0)}</span></div>
                  <div className="fp-mg">
                    {sections.map((s) => <div key={s.key} className="fp-mc" style={{ '--c': `var(--pc-${s.key})` }}>{cell(L.perGame && L.perGame[s.key])}</div>)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="fp-key"><span><i className="g1" />earned on guess 1</span><span><i className="g2" />guess 2</span><span><i className="g3" />guess 3</span><span>The figure under a score is how far off the first guess was.</span></div>
        </>
      )}
      <div className="fp-paid">
      <div className="fp-bh"><h3>Where the field paid</h3><span>{sum ? `${sum.toLocaleString()} ${sum === 1 ? 'run' : 'runs'} today` : 'No finished runs yet'}</span></div>
      {sum > 0 && (
        <div className="fp-dist">
          <div className="fp-bar">
            {ORD.map((i, k) => {
              const w = counts[i] / sum * 100;
              return <span key={i} style={{ width: `${w}%`, background: CARD_COL[i][0], color: CARD_COL[i][1], animationDelay: `${k * 0.08}s` }} title={`${ranks[i][3]}: ${counts[i]}`}>{''}</span>;
            })}
          </div>
          {pos != null && <div className="fp-mark"><i style={{ left: `${pos}%` }}>You · {ranks[myTi][3]}</i></div>}
          <div className="fp-leg">{ORD.map((i) => <span key={i}>{ranks[i][3]} <b>{counts[i].toLocaleString()}</b></span>)}</div>
        </div>
      )}
      </div>
      <div className="fp-bh"><h3>Today&rsquo;s shelf</h3><span>field average and the best first guess</span></div>
      <div className="fp-shelf">
        {sections.map((s, i) => {
          const g = per[s.key];
          const mine = counted[i];
          return (
            <div key={s.key} className={`fp-sh${i === tough ? ' tough' : ''}`} style={{ '--c': `var(--pc-${s.key})` }}>
              <div className="k">{s.name}</div>
              <div className="it">{fmtCents(s.day.price)}</div>
              <div className="f">
                Field avg <b>{g && g.avg != null ? g.avg : '-'}</b><br />
                Best first guess <b>{g && g.bestBps != null ? offLabel(g.bestBps) : '-'}</b>
                {mine && typeof mine.first === 'number' ? <><br />Yours <b>{pctLabel(errOf(mine.first, s.day.price))}</b></> : null}
              </div>
              {i === tough && <span className="tg">Toughest today</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── THE ITEMS POP-UP: today's five, one at a time ──────────────────────────

const CSS = `
.pc *{box-sizing:border-box}
/* THE FIELD */
.fp{max-width:820px;margin:26px auto 0;padding:18px 16px 4px;border-top:1px solid var(--pc-line);text-align:left}
.fp-wait{color:var(--pc-mute);font-weight:700;font-size:13px;text-align:center;padding:14px 0}
.fp-bh{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:18px 0 0}
.fp-bh:first-child{margin-top:0}
.fp-bh h3{margin:0;font-size:18px;font-weight:800;letter-spacing:-.01em}
.fp-bh span,.fp-bh a{font-size:12px;font-weight:700;color:var(--pc-mute);text-decoration:none}
.fp-bh a{color:var(--pc-hi)}
.fp-dist{margin:12px 0 2px}
.fp-bar{display:flex;height:34px;border-radius:8px;overflow:hidden;border:1px solid var(--pc-line)}
.fp-bar span{display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden;transform-origin:left;animation:fpgrow .9s cubic-bezier(.2,.7,.3,1) both}
@keyframes fpgrow{from{transform:scaleX(0)}to{transform:none}}
.fp-mark{position:relative;height:22px}
.fp-mark i{position:absolute;top:4px;transform:translateX(-50%);font-style:normal;font-size:11px;font-weight:800;color:var(--pc-hi);white-space:nowrap}
.fp-mark i::before{content:"";position:absolute;left:50%;top:-6px;margin-left:-5px;border:5px solid transparent;border-bottom-color:var(--pc-hi);border-top:0}
.fp-leg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:11.5px;color:var(--pc-mute);font-weight:700}
.fp-leg b{color:var(--pc-ink);font-variant-numeric:tabular-nums}
.fp-lb{overflow-x:auto;margin-top:10px}
.fp-t{width:100%;min-width:620px;border-collapse:separate;border-spacing:0 6px}
.fp-t th{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--pc-mute);text-align:center;padding:0 4px;white-space:nowrap}
.fp-t th:nth-child(-n+2){text-align:left}
.fp-t th i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}
.fp-t td{background:var(--pc-surf);padding:7px 6px;border-top:1px solid var(--pc-line);border-bottom:1px solid var(--pc-line);text-align:center;vertical-align:middle}
.fp-t td:first-child{border-left:1px solid var(--pc-line);border-radius:10px 0 0 10px;width:34px;font-weight:800;color:var(--pc-mute);font-variant-numeric:tabular-nums}
.fp-t td:last-child{border-right:1px solid var(--pc-line);border-radius:0 10px 10px 0}
.fp-t tr{animation:fprin .4s ease both}
@keyframes fprin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.fp-t tr.me td{background:rgba(125,211,252,.09);border-color:rgba(125,211,252,.5)}
.fp-you{font-style:normal;font-size:9.5px;font-weight:800;letter-spacing:.12em;color:var(--pc-hi);margin-left:8px;vertical-align:1px}
.fp-paid{margin-top:16px;padding-top:4px;border-top:1px solid var(--pc-line)}
.fp-paid .fp-bh h3{font-size:14px}
.fp-paid .fp-bar{height:14px;border-radius:7px}
.fp-nm{text-align:left!important;font-weight:800;white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis}
.fp-nm .cc{display:inline-block;width:22px;height:14px;border-radius:3px;margin-right:8px;vertical-align:-2px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.15)}
.fp-cell{display:flex;flex-direction:column;align-items:center;gap:1px;line-height:1.1}
.fp-cell b{font-size:17px;font-variant-numeric:tabular-nums}
.fp-cell span{font-size:10px;font-weight:700;color:var(--pc-mute);white-space:nowrap;font-variant-numeric:tabular-nums}
.fp-cell .gp{display:inline-flex;gap:2px;margin-top:2px}
.fp-cell .gp i{width:6px;height:6px;border-radius:50%;background:var(--pc-rail)}
.fp-cell .gp i.u{background:#475569}
.fp-cell.g1 .gp i.h{background:#7dd3fc}
.fp-cell.g2 .gp i.h{background:#a5b4fc}
.fp-cell.g3 .gp i.h{background:#94a3b8}
.fp-cell.ten b{color:var(--pc-good)}
.fp-tot{font-size:18px;font-weight:800;font-variant-numeric:tabular-nums}
.fp-key{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:6px;font-size:11.5px;color:var(--pc-mute);font-weight:700;align-items:center}
.fp-key i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}
.fp-key i.g1{background:#7dd3fc}.fp-key i.g2{background:#a5b4fc}.fp-key i.g3{background:#94a3b8}
.fp-shelf{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:10px}
@media(max-width:620px){.fp-shelf{grid-template-columns:repeat(2,minmax(0,1fr))}}
.fp-sh{border:1px solid var(--pc-line);border-radius:12px;padding:10px;background:var(--pc-surf);border-top:3px solid var(--c)}
.fp-sh .k{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--c)}
.fp-sh .it{font-size:15px;font-weight:800;margin:3px 0 6px;font-variant-numeric:tabular-nums}
.fp-sh .f{font-size:11.5px;color:var(--pc-mute);font-weight:700;line-height:1.5}
.fp-sh .f b{color:var(--pc-ink);font-variant-numeric:tabular-nums}
.fp-sh.tough{box-shadow:0 0 0 1.5px var(--pc-bad) inset}
.fp-sh .tg{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--pc-bad);margin-top:6px}
@media(prefers-reduced-motion:reduce){.fp-bar span,.fp-t tr,.fp-mr{animation:none}}
.fp-ml{display:none}
@media(max-width:620px){
.fp{padding-left:12px;padding-right:12px}
.fp-lb{display:none}
.fp-ml{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.fp-mr{background:var(--pc-surf);border:1px solid var(--pc-line);border-radius:12px;padding:8px 10px;animation:fprin .4s ease both}
.fp-mr.me{background:rgba(125,211,252,.09);border-color:rgba(125,211,252,.5)}
.fp-mh{display:flex;align-items:center;gap:8px;min-width:0}
.fp-mh b{font-weight:800;color:var(--pc-mute);font-variant-numeric:tabular-nums;min-width:14px}
.fp-mh .cc{flex:none;width:20px;height:13px;border-radius:3px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.15)}
.fp-mn{flex:1;min-width:0;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fp-mt{font-size:17px;font-weight:800;font-variant-numeric:tabular-nums}
.fp-mg{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin-top:6px}
.fp-mc{border-top:2px solid var(--c);padding-top:4px;min-width:0}
.fp-mc .fp-cell b{font-size:15px}
.fp-mc .fp-cell span{font-size:9px}
.fp-key span:last-child{flex-basis:100%}
}
@media(max-width:720px){
.cf-stage.settled .cf-cw{animation:cfshrink .7s 1.6s cubic-bezier(.4,0,.2,1) both}
@keyframes cfshrink{from{width:min(340px,92%)}to{width:min(150px,42%)}}
.cf-stage.settled .cf-cardcol{padding-top:6px}
}
@media(max-width:720px) and (prefers-reduced-motion:reduce){.cf-stage.settled .cf-cw{animation:none;width:min(150px,42%)}}

.pc .eb{font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--pc-mute)}
.pc-cap{display:flex;align-items:center;gap:12px;max-width:760px;margin:0 auto;padding:12px 16px;font-size:13px}
.pc-home{font-family:${MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--pc-mute);text-decoration:none}
.pc-cap b{font-weight:900;letter-spacing:-.01em}
.pc-capd{color:var(--pc-mute);font-weight:700}
.pc-capt{display:flex;gap:4px;margin-left:auto}
.pc-capt i{width:18px;height:6px;border-radius:3px;background:var(--pc-line)}
.pc-capt i.on{box-shadow:0 0 0 2px var(--pc-ground),0 0 0 3px var(--pc-ink)}
.pc-theme{margin-left:auto;background:none;border:1px solid var(--pc-line);color:var(--pc-ink);border-radius:999px;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.pc-capt + .pc-theme{margin-left:8px}
.pc-lb{margin-left:auto;font-family:${MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--pc-cta);text-decoration:none}
.pc-lb:hover{color:var(--pc-ink)}
/* PREGAME */
.pre{max-width:820px;margin:0 auto;padding:18px 16px 50px;text-align:center}
.title{margin:10px 0 0;font-size:clamp(44px,9vw,76px);font-weight:900;letter-spacing:-.035em;line-height:.95}
.title span{display:inline-block;animation:pcdrop .7s cubic-bezier(.2,1.4,.4,1) both}
.title span:nth-child(2){animation-delay:.08s}
@keyframes pcdrop{from{transform:translateY(-40px);opacity:0}to{transform:none;opacity:1}}
.odo{margin:16px auto 0;display:inline-flex;align-items:center;gap:2px;font:900 30px ${MONO};background:var(--pc-panel);border:1.5px solid var(--pc-line);border-radius:12px;padding:8px 16px;box-shadow:var(--pc-shadow);line-height:1.15em}
.odo .d{display:inline-block;width:.68em;height:1.15em;overflow:hidden;position:relative;vertical-align:top}
.odo .d i{position:absolute;left:0;right:0;top:0;font-style:normal;display:flex;flex-direction:column;animation:pcspin 1.6s steps(10) infinite}
.odo .d i b{display:block;height:1.15em;line-height:1.15em;text-align:center}
@keyframes pcspin{from{transform:translateY(0)}to{transform:translateY(-11.5em)}}
.odo .q{color:var(--pc-mute)}
.lede{margin:14px auto 0;max-width:540px;font-size:15.5px;font-weight:600;line-height:1.5;color:var(--pc-mute)}
.lede b{color:var(--pc-ink)}
.rail{position:relative;margin:34px auto 0;max-width:780px;height:10px;border-radius:5px;background:var(--pc-rail);box-shadow:inset 0 2px 3px rgba(0,0,0,.25)}
.tags{display:flex;justify-content:space-around;gap:8px;max-width:780px;margin:0 auto;padding:0 4px}
.hang{flex:1;max-width:150px;display:flex;flex-direction:column;align-items:center;transform-origin:50% 0;animation-name:pcin,pcswing;animation-timing-function:cubic-bezier(.2,1.3,.4,1),ease-in-out;animation-iteration-count:1,infinite;animation-fill-mode:both,none}
@keyframes pcin{from{opacity:0;transform:translateY(-60px) rotate(-8deg)}to{opacity:1;transform:none}}
@keyframes pcswing{0%,100%{transform:rotate(2.2deg)}50%{transform:rotate(-2.2deg)}}
.string{width:2px;height:30px;background:var(--pc-rail)}
.tag{position:relative;width:100%;background:var(--pc-panel);border:2px solid var(--c);border-radius:6px 6px 14px 14px;padding:24px 8px 14px;box-shadow:var(--pc-shadow);clip-path:polygon(18% 0,82% 0,100% 11%,100% 100%,0 100%,0 11%)}
.tag::before{content:'';position:absolute;top:8px;left:50%;width:11px;height:11px;margin-left:-5.5px;border-radius:50%;background:var(--pc-ground);border:2px solid var(--c)}
.tag .k{font:500 10px ${MONO};letter-spacing:.14em;text-transform:uppercase;color:var(--c)}
.tag .n{font-size:18px;font-weight:900;letter-spacing:-.01em;margin-top:2px}
.tag .chip{display:inline-block;margin-top:8px;border:1.5px solid var(--pc-line);border-radius:999px;padding:2px 8px;font-size:11px;font-weight:800;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tag .pq{margin-top:10px;font:900 18px ${MONO};color:var(--c);letter-spacing:.01em;white-space:nowrap}
.tag .pq em{font-style:normal;display:inline-block;animation:pcblink 1.4s steps(1) infinite}
.tag .bk{margin-top:6px;font-size:10.5px;font-weight:800;color:var(--pc-mute)}
@keyframes pcblink{50%{opacity:.25}}
.facts{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:30px auto 0}
.fact{background:var(--pc-panel);border:1.5px solid var(--pc-line);border-radius:12px;padding:10px 14px;box-shadow:var(--pc-shadow);text-align:left;min-width:118px}
.fact b{display:block;font-size:22px;font-weight:900}
.fact span{font-size:11.5px;font-weight:700;color:var(--pc-mute)}
.heat{max-width:460px;margin:22px auto 0}
.heat .bar{height:10px;border-radius:999px;background:linear-gradient(90deg,#7dd3fc,#93c5fd,#c4b5fd,#fbbf24,#fb923c,#f87171,#4ade80)}
.heat .lbl{display:flex;justify-content:space-between;margin-top:6px;font:500 10px ${MONO};letter-spacing:.12em;text-transform:uppercase;color:var(--pc-mute)}
.pc .start{margin:28px auto 0;display:inline-flex;align-items:center;gap:10px;font:900 19px ${SANS};border:0;border-radius:14px;padding:16px 34px;background:var(--pc-cta);color:var(--pc-cta-ink);cursor:pointer;box-shadow:var(--pc-shadow);position:relative;overflow:hidden}
.pc .start::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transform:translateX(-100%);animation:pcsheen 2.6s 1.4s ease-in-out infinite}
@keyframes pcsheen{to{transform:translateX(100%)}}
.pc .start:active{transform:scale(.97)}
.sub2{margin-top:12px;font-size:12.5px;font-weight:700;color:var(--pc-mute)}
.sub2 a{color:var(--pc-ink)}
.gun{display:block;width:100%;max-width:440px;margin:18px auto 0;padding:0;border:1.5px solid var(--pc-line);border-radius:16px;background:var(--pc-panel);color:var(--pc-ink);box-shadow:var(--pc-shadow);overflow:hidden;cursor:pointer;text-align:center;font:inherit}
.gun .gscr{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 10px 10px}
.gun .gscr small{font:500 9.5px ${MONO};letter-spacing:.16em;text-transform:uppercase;color:var(--pc-mute)}
.gun .odo{margin:0;border:0;background:none;box-shadow:none;padding:0;font-size:34px}
.gun .gtrig{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px;padding:15px 18px;background:var(--pc-cta);color:var(--pc-cta-ink);font:900 19px ${SANS}}
.gun .gtrig::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transform:translateX(-100%);animation:pcsheen 2.6s 1.4s ease-in-out infinite}
.gun:active{transform:scale(.98)}
.gun:focus-visible,.pre-how:focus-visible{outline:2px solid var(--pc-ink);outline-offset:3px}
.pre-row{display:flex;flex-direction:row-reverse;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;max-width:780px;margin:16px auto 0}
.pre-row .sub2{margin:0;text-align:right;max-width:260px}
.pre-how{background:none;border:0;padding:6px 0;color:var(--pc-mute);font:700 13px ${SANS};text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.pre-hw{animation:pcrise .3s ease both}
.pre-hw .facts{margin-top:18px}
.pre.leave .hang{animation:pcout .55s cubic-bezier(.6,0,.8,.4) both !important}
@keyframes pcout{to{transform:translateY(-140px) rotate(10deg);opacity:0}}
.pre.leave .fade{transition:opacity .4s;opacity:0}
/* PLAY */
.pc-play{max-width:560px;margin:0 auto;padding:8px 12px 60px}
.pc-sechd{display:flex;align-items:center;gap:10px;margin:6px 0 12px;animation:pcrise .4s ease both}
.pc-sectag{font:800 11px ${SANS};letter-spacing:.06em;text-transform:uppercase;color:#0b0f1a;padding:5px 10px 5px 14px;border-radius:5px 7px 7px 5px;position:relative}
.pc-sectag:before{content:"";position:absolute;left:5px;top:50%;width:4px;height:4px;margin-top:-2px;border-radius:50%;background:var(--pc-ground)}
[data-stage-theme="light"] .pc-sectag{color:#fff}
.pc-sechd b{font-size:20px;font-weight:900;letter-spacing:-.01em}
.pc-run{margin-left:auto;font-family:${MONO};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--pc-mute)}
.pc-banked{margin:0 0 12px;padding:10px 12px;border:1.5px dashed var(--pc-line);border-radius:10px;font-size:13px;font-weight:700;color:var(--pc-mute)}
.pc-banked b{color:var(--pc-ink)}
.pc-between{text-align:center;padding:26px 8px;animation:pcrise .4s ease both}
.pc-bscore{font-size:64px;font-weight:900;letter-spacing:-.04em;margin-top:6px}
.pc-bscore small{font-size:24px;color:var(--pc-mute)}
.pc-bprice{color:var(--pc-mute);font-weight:700}
.pc-bprice b{color:var(--pc-ink)}
.pc-rolling{margin:26px auto 0;display:inline-flex;align-items:center;gap:10px;font:800 15px ${SANS};color:var(--pc-cta)}
.pc-dots{display:inline-flex;gap:5px}
.pc-dots i{width:6px;height:6px;border-radius:50%;background:var(--pc-cta);animation:pcdot 1s ease-in-out infinite}
.pc-dots i:nth-child(2){animation-delay:.15s}.pc-dots i:nth-child(3){animation-delay:.3s}
@keyframes pcdot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
@keyframes pcrise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
/* FINALE: the card climbs, then taps */
.pf{position:relative;z-index:2;max-width:980px;margin:0 auto;padding:14px 16px 70px}
.pf > .eb{text-align:center}
.cf-stage{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:36px;align-items:center;margin-top:22px;min-height:430px}
.cf-cardcol{position:relative;display:flex;justify-content:center;align-items:center;min-height:250px}
.cf-cw{container-type:inline-size;width:min(400px,100%);transition:transform .75s cubic-bezier(.5,0,.2,1);position:relative;z-index:3}
.cf-right{position:relative;display:grid;min-height:380px}
.cf-right > *{grid-area:1/1}
.cf-upg{position:absolute;left:50%;top:-10px;font:800 11px ${SANS};letter-spacing:.18em;text-transform:uppercase;color:var(--pc-cta-ink);background:var(--pc-cta);padding:6px 11px;border-radius:999px;white-space:nowrap;z-index:4;pointer-events:none;animation:cfup 1s ease-out both}
@keyframes cfup{0%{opacity:0;transform:translate(-50%,12px)}20%{opacity:1;transform:translate(-50%,0)}75%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-8px)}}
.cf-spark{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:var(--pc-hi);z-index:5;pointer-events:none;animation:cfspark var(--d) cubic-bezier(.2,.7,.3,1) both}
@keyframes cfspark{from{transform:translate(0,0) scale(1);opacity:1}to{transform:translate(var(--x),var(--y)) scale(.2);opacity:0}}
.cf-term{justify-self:center;align-self:center;width:min(270px,100%);background:linear-gradient(180deg,#2a2f3a,#1b1f27);border-radius:26px;padding:16px 16px 20px;box-shadow:0 30px 60px -25px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.08);transition:opacity .45s,transform .45s}
.cf-term.gone{opacity:0;transform:translateY(14px) scale(.96);pointer-events:none}
.cf-tap{position:relative;display:flex;justify-content:center;align-items:center;height:30px;margin-bottom:8px;color:#8a93a6}
.cf-tap svg{width:26px;height:26px}
.cf-tap i{position:absolute;left:50%;top:50%;width:30px;height:30px;margin:-15px;border:2px solid var(--pc-good);border-radius:50%;opacity:0;animation:cfring 1s ease-out infinite}
.cf-tap i.r2{animation-delay:.33s}.cf-tap i.r3{animation-delay:.66s}
@keyframes cfring{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2.6);opacity:0}}
.cf-scr{background:#0a1220;border-radius:12px;padding:12px 12px 10px;height:208px;display:flex;flex-direction:column;font-family:${MONO};color:#cfd8ea;box-shadow:inset 0 0 0 1px #1f2a40;transition:background .3s}
.cf-scr.ok{background:#06291d}.cf-scr.no{background:#2e0c10}
.cf-hd{display:flex;justify-content:space-between;font:800 10px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:#6f7d99;margin-bottom:8px}
.cf-lines{display:flex;flex-direction:column;gap:5px;flex:1}
.cf-lr{display:flex;justify-content:space-between;font-size:13px;animation:cfin .25s ease both}
.cf-lr b{font-weight:500}.cf-lr b.ten{color:var(--pc-hi)}
.cf-tot{display:flex;justify-content:space-between;align-items:baseline;border-top:1px dashed #2a3858;margin-top:8px;padding-top:8px;font-size:12px;color:#8a93a6}
.cf-tot b{font:500 26px ${MONO};color:#fff;font-variant-numeric:tabular-nums}
.cf-tot small{font-size:13px;color:#8a93a6}
.cf-msg{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;animation:cfin .3s ease both}
.cf-msg .big{font:900 26px ${SANS};letter-spacing:.04em;color:#fff}
.cf-scr.ok .big{color:var(--pc-good)}.cf-scr.no .big{color:var(--pc-bad)}
.cf-msg .sm{font:700 11px ${SANS};letter-spacing:.14em;text-transform:uppercase;color:#a9b3c7}
.cf-msg .who{font:900 15px ${SANS};color:#fff}
.cf-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:14px}
.cf-keys i{height:16px;border-radius:5px;background:#323845;box-shadow:inset 0 -2px 0 rgba(0,0,0,.35)}
.cf-keys i:nth-child(10){background:#7f1d1d}.cf-keys i:nth-child(11){background:#854d0e}.cf-keys i:nth-child(12){background:#14532d}
@keyframes cfin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.cf-copy{display:none;align-self:center;min-width:0;text-align:left}
.cf-copy.on{display:block;animation:cfin .6s .1s ease both}
.cf-you{font:800 12px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:var(--pc-hi)}
.cf-nm{font-size:clamp(34px,5vw,50px);font-weight:900;letter-spacing:-.02em;line-height:1;margin:8px 0 10px;text-wrap:balance}
.cf-ln{font-size:17px;line-height:1.45;margin:0 0 16px;max-width:34ch;color:var(--pc-ink)}
.cf-stats{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:8px;margin-bottom:10px;max-width:390px}
.cf-stats div{background:var(--pc-surf);border:1px solid var(--pc-line);border-radius:12px;padding:9px 11px;display:flex;flex-direction:column;gap:3px;min-width:0}
.cf-stats b{font:500 20px ${MONO};white-space:nowrap}
.cf-stats span{font:800 9.5px ${SANS};letter-spacing:.12em;text-transform:uppercase;color:var(--pc-mute)}
.cf-games{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;max-width:390px}
.cf-games div{background:var(--pc-surf);border:1px solid var(--pc-line);border-radius:9px;padding:7px 2px;text-align:center;min-width:0}
.cf-games i{display:block;font:normal 800 8.5px ${SANS};letter-spacing:.05em;text-transform:uppercase;color:var(--pc-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cf-games b{font:500 17px ${MONO}}
.cf-games .hi{border-color:var(--pc-hi)}.cf-games .hi b{color:var(--pc-hi)}
.cf-games .lo b{color:var(--pc-bad)}
[data-stage-theme="light"] .cf-games .lo b{color:#b91c1c}
.cf-next{display:inline-block;margin-top:12px;font-size:13px;font-weight:700;padding:9px 12px;border-radius:10px;background:var(--pc-surf);border:1px solid var(--pc-line)}
.cf-next b{color:var(--pc-hi)}
/* LAYOUT A (owner, 2026-10-12): settled, the card drops to a small badge
   beside the result, and everything below it reads as one scoreboard. */
@media(min-width:721px){
.cf-stage.settled{grid-template-columns:240px minmax(0,1fr);gap:30px;min-height:0;align-items:center;margin-top:16px}
.cf-stage.settled .cf-cardcol{min-height:0}
.cf-stage.settled .cf-cw{width:240px}
.cf-stage.settled .cf-right{min-height:0}
.cf-stage.settled .cf-term{position:absolute;left:0;right:0;top:0;margin:0 auto}
}
.cf-stage.settled .cf-nm{font-size:clamp(30px,4vw,40px);margin:6px 0 6px}
.cf-stage.settled .cf-ln{font-size:14.5px;margin:0 0 10px;color:var(--pc-mute)}
.cf-sl{display:flex;flex-wrap:wrap;gap:4px 18px;font-size:14px;font-weight:700;color:var(--pc-mute);margin-bottom:10px}
.cf-sl b{font-size:18px;font-weight:800;color:var(--pc-ink);font-variant-numeric:tabular-nums}
.cf-pills{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px}
.cf-pills .cf-next{margin-top:0;border-radius:999px;padding:6px 12px}
.cf-shelf{font-size:13px;font-weight:700;color:var(--pc-mute)}
.cf-shelf b{color:var(--pc-ink);font-variant-numeric:tabular-nums}
.pf-foot{max-width:820px;margin:22px auto 0;padding:0 16px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px}
.pf-foot > :first-child{flex:1 1 360px;min-width:0}
.pf-links{display:flex;gap:16px}
.pf-links a{font-size:13px;font-weight:800;color:var(--pc-mute);text-decoration:none}
.pf-links a:hover{color:var(--pc-ink)}
.pf-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.pf-btns a,.pf-btns button{font:800 14px ${SANS};padding:12px 18px;border-radius:12px;text-decoration:none;color:var(--pc-ink);border:1px solid var(--pc-line);background:transparent;cursor:pointer}
.pf-btns .pri{background:var(--pc-cta);color:var(--pc-cta-ink);border-color:transparent}
/* the payment card, sized in container units */
.pk{width:100%;aspect-ratio:1.586;border-radius:5cqw;position:relative;padding:5.5cqw 6cqw;overflow:hidden;box-shadow:0 30px 60px -20px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.07) inset;display:flex;flex-direction:column;justify-content:space-between;transition:transform .14s ease-in;text-align:left}
.pk.squash{transform:rotateY(90deg)}
.pk::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.45) 48%,transparent 60%);background-size:260% 100%;background-position:120% 0;pointer-events:none;mix-blend-mode:overlay}
.pk.shine::after{animation:pkshine 1.3s ease-out both}
@keyframes pkshine{from{background-position:120% 0}to{background-position:-40% 0}}
.pk-top{display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:1}
.pk-brand{font:800 2.9cqw/1.25 ${SANS};letter-spacing:.2em;text-transform:uppercase}
.pk-brand small{display:block;font-weight:700;letter-spacing:.14em;opacity:.7;font-size:2.4cqw}
.pk-kind{font:800 2.8cqw ${SANS};letter-spacing:.2em;text-transform:uppercase;text-align:right}
.pk-kind small{display:block;font:700 2.2cqw ${SANS};letter-spacing:.12em;opacity:.7;margin-top:.6cqw}
.pk-mid{display:flex;align-items:center;gap:3.5cqw;position:relative;z-index:1}
.pk-chip{width:12cqw;height:9.4cqw;border-radius:1.8cqw;background:linear-gradient(135deg,#f6dc8a,#c9a227 55%,#f2d272);position:relative;flex:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)}
.pk-chip::before{content:"";position:absolute;inset:2.1cqw 0;border-top:1px solid rgba(0,0,0,.3);border-bottom:1px solid rgba(0,0,0,.3)}
.pk-chip::after{content:"";position:absolute;inset:0 4cqw;border-left:1px solid rgba(0,0,0,.3);border-right:1px solid rgba(0,0,0,.3)}
.pk-chip.silver{background:linear-gradient(135deg,#eef0f4,#a7adb8 55%,#dfe2e8)}
.pk-wave{display:flex;width:5.5cqw;height:5.5cqw;opacity:.6}
.pk-wave svg{width:100%;height:100%}
.pk-tier{font:900 7.4cqw/1 ${SANS};letter-spacing:-.02em;position:relative;z-index:1}
.pk-bot{display:flex;justify-content:space-between;align-items:flex-end;gap:3cqw;position:relative;z-index:1}
.pk-num{font:500 6.2cqw ${MONO};letter-spacing:.04em;white-space:nowrap;font-variant-numeric:tabular-nums}
.pk-num small{font-size:3.4cqw;opacity:.7}
.pk-br{display:flex;gap:3cqw;align-items:flex-end}
.pk-since{font:700 2.3cqw/1.35 ${SANS};letter-spacing:.14em;text-transform:uppercase;text-align:right;opacity:.8}
.pk-since b{display:block;font:500 3.1cqw ${MONO};letter-spacing:.04em}
.pk-mark{display:flex;align-items:center}
.pk-mark i{width:7cqw;height:7cqw;border-radius:50%;border:.7cqw solid currentColor;opacity:.75}
.pk-mark i+i{margin-left:-2.6cqw;opacity:.45}
.pk-debit{font:800 italic 4.2cqw ${SANS};letter-spacing:.06em}
.pk0{background:repeating-linear-gradient(115deg,rgba(255,255,255,.035) 0 2px,transparent 2px 5px),linear-gradient(140deg,#2b2b30,#0c0c0f 60%,#1e1e23);color:#e9cf7f}
.pk0 .pk-tier,.pk0 .pk-num{background:linear-gradient(180deg,#fbe7a6,#c9a227 60%,#f1d27a);-webkit-background-clip:text;background-clip:text;color:transparent}
.pk1{background:radial-gradient(120% 90% at 0% 0%,#ffe9a8,#e6b532 40%,#a97a10 100%);color:#2a1f04}
.pk2{background:radial-gradient(130% 120% at 100% 0%,#5b8ff0,#2f6fe4 35%,#163a8c 100%);color:#fff}
.pk3{background:linear-gradient(160deg,#4b5a6e,#36424f);color:#e7edf4}
.pk3::before{content:"";position:absolute;right:-12cqw;top:-18cqw;width:60cqw;height:60cqw;border-radius:50%;background:rgba(255,255,255,.05)}
.pk4{background:#fbfaf6;color:#22252b;padding-top:9cqw;box-shadow:0 30px 60px -20px rgba(0,0,0,.6),0 0 0 1px rgba(11,15,26,.12) inset}
.pk4::before{content:"";position:absolute;left:0;right:0;top:0;height:6.5cqw;background:repeating-linear-gradient(90deg,#ff6b3d 0 18%,#ffb02e 18% 36%,#28c08a 36% 54%,#3d8bff 54% 72%,#c560ff 72% 90%,#ff6b3d 90% 100%)}
.pk4::after{mix-blend-mode:multiply;opacity:.3}
.pk4 .pk-kind{color:#e2522a}
.pk-peg{position:absolute;top:1.6cqw;left:50%;transform:translateX(-50%);width:14cqw;height:3.4cqw;border-radius:2cqw;background:var(--pc-ground);z-index:2}
.pk-bal{font:800 2.3cqw ${SANS};letter-spacing:.14em;text-transform:uppercase;color:#6b7280}
.pk-bal b{display:block;font:500 5cqw ${MONO};letter-spacing:.02em;color:#dc2626}
@media(max-width:720px){
.cf-stage{display:flex;flex-direction:column;align-items:stretch;gap:18px;min-height:0;margin-top:14px}
.cf-right{display:contents}
.cf-term{order:1;max-height:420px;overflow:hidden;transition:opacity .4s,transform .4s,max-height .6s .1s,padding .6s .1s}
.cf-term.gone{max-height:0;padding-top:0;padding-bottom:0;transform:none}
.cf-stage.settled{gap:12px}
.cf-cardcol{order:2;min-height:0;padding-top:14px}
.cf-cw{width:min(340px,92%)}
.cf-copy{order:3}
.cf-ln{font-size:15.5px}
.cf-stats,.cf-games{max-width:none}
.pf-btns a,.pf-btns button{flex:1 1 40%;text-align:center;padding:12px 10px}
}
@keyframes pcfade{from{opacity:0}to{opacity:1}}
@media(max-width:600px){.tags{gap:4px}.tag{padding:27px 3px 8px}.tag .kn{display:none}.tag .k{white-space:nowrap;overflow:hidden;text-overflow:clip}.tag .n{font-size:13px}.tag .k{font-size:8.5px;letter-spacing:.06em}.tag .chip{display:none}.tag .pq{font-size:12px;margin-top:6px}.string{height:14px}.title{font-size:42px}.pre{padding-top:8px}.gun .odo{font-size:30px}.pre-row .sub2{font-size:11.5px;max-width:200px}.lede{font-size:14px;margin-top:10px;line-height:1.4}.lede-x{display:none}.rail{margin-top:22px;height:8px}.gun{margin-top:14px}.pre .facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:22px}.pre .fact{min-width:0;padding:8px;text-align:center;border-radius:10px}.pre .fact b{font-size:18px}.pre .fact span{font-size:10px;line-height:1.25;display:block}.heat .lbl{font-size:9px;letter-spacing:.08em}}
@media(prefers-reduced-motion:reduce){.pc *{animation-duration:.01ms !important;animation-iteration-count:1 !important}}
`;
