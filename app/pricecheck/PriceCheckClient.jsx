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
// ON THE STAGE (owner, 2026-10-25): the run's four screens take the Trivia
// Gauntlet's stage look (app/GauntletScreens.jsx). The entry is GauntletGate
// with the price gun's register kept as its centerpiece; between tags,
// GauntletBetween shows the price, your guess and the tag score; play is
// RunPlayFrame around the PriceGame engine; the ending is GauntletEndStage,
// climbing THE SHOPPERS ladder (ranksFor in lib/price-games) with its cards.
// Ten seconds after the ending comes up the five items open in one pop-up
// (Pricer's reveal, kept), ON WHATEVER PAGE THE PLAYER IS ON BY THEN (owner,
// 2026-10-02): see app/pricecheck/ItemsPop.jsx. Once it is closed, the
// Trivia Gauntlet offer follows ten seconds later, or as soon as the player
// leaves the page, if that run has not been finished today (owner,
// 2026-10-01: slow the pop-ups down). The old Scanner ending
// (PriceScanner.jsx) is no longer drawn.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PriceGame, { readDoneSave } from '../price/PriceGame';
import MoreRunsPop, { MoreRunsList, otherRuns } from '../circuits/MoreRuns';
import { RUN_DOORS, runDoneToday } from '../circuits/RunDoorPop';
import PriceCrowd from '../price/PriceCrowd';
import { WeekStrip, useShopWeek } from './ShopWeek';
import ItemsPop, { itemsFor, scheduleItems, spendItems } from './ItemsPop';
import PayCard from './PayCard';
import useCircuitBoard from '../circuits/useCircuitBoard';
import { withRef } from '@/lib/referrals';
import { isMobileDevice } from '@/lib/is-mobile';
import ChallengeStrip from '../ChallengeStrip';
import { RunChallengeButton, RunChallengeLine, RunChallengeCapture, runToken, RunMeme } from '../RunChallenge';
import { fmtCents, runRankOf, runTierOf, ranksFor, ranksTag, isV2, scoreGuesses } from '@/lib/price-games';
import { GauntletGate, GauntletBetween, GauntletEndStage, GauntletCover, RunPlayFrame, useGauntletLook } from '../GauntletScreens';
import { rampFor } from '@/lib/circuits';
import { softGround, RAMP_INK } from '@/lib/category-ramp';
import { isDarkLook } from '@/lib/stage-look';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const RUN_ID = 'pricecheck';
// How long the card between two tags holds before the next one starts on its
// own (Hold stops it, the button skips it), as on the Gauntlet's stage.
const BETWEEN_MS = 12000;
// The colour of each card on the shopper ladder, best first (RUN_RANKS order).
const CARD_COL = [['#1e1e23', '#e9cf7f'], ['#e6b532', '#2a1f04'], ['#2f6fe4', '#ffffff'], ['#4b5a6e', '#e7edf4'], ['#fbfaf6', '#22252b']];
const NUMS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
const freshRun = () => ({ v: 1, rule: 2, phase: 'idle', si: 0, t0: null, results: {} });

// The first (counted) play of a game today, read off its own solo save.
function bankedOf(sec) {
  const s = readDoneSave(sec.key, sec.num, sec.quizId);
  if (!s || !s.guesses.length) return null;
  const sg = scoreGuesses(s.guesses, sec.day.price, sec.quizId);
  return { score: sg.score, at: sg.at, best: sg.at >= 0 ? s.guesses[sg.at] : null, first: s.guesses[0], guesses: s.guesses.length, secs: s.t0 && s.tEnd ? Math.round((s.tEnd - s.t0) / 1000) : 0, banked: true };
}

// THE PRICE GUN, kept for the stage entry (owner, 2026-10-25): the register
// whose digits never land, compact, between the title and the tags. The gate's
// own button is Start, so the register is a picture now, not the trigger. The
// scoring note sits under it and opens in the same box.
const ODO = ['1234567890', '7391582640', '4086291537', ',', '9502738164', '2618407395', '5173094826'];
const ODO_SPEED = [1.6, 1.1, 0.8, 0, 0.6, 0.45, 0.35];
function Register({ v2, max, n, sections, howOpen, onHow }) {
  return (
    <div className="pcg">
      <div className="pcg-box">
        {howOpen ? (
          <div className="pcg-how">
            <div className="pcg-facts">
              <span><b>{n}</b>tags</span><span><b>{v2 ? 3 : 5}</b>guesses each</span><span><b>{max}</b>points</span><span><b>1%</b>bullseye</span>
            </div>
            {v2 ? <p>The first guess can earn the full 10, the second up to 6, the third up to 3. The best one counts.</p> : <p>Your closest guess counts, 0 to 10.</p>}
          </div>
        ) : (
          <>
            <small>Today&rsquo;s register</small>
            <span className="odo" aria-hidden="true"><span className="q">$</span>
              {ODO.map((d, i) => (
                d === ',' ? <span key={i} className="q">,</span>
                  : <span key={i} className="d"><i style={{ animationDuration: `${ODO_SPEED[i]}s` }}>{d.split('').map((c, j) => <b key={j}>{c}</b>)}</i></span>
              ))}
            </span>
          </>
        )}
      </div>
      <div className="pcg-note">Played one today? Your first score counts.</div>
    </div>
  );
}

// Under the Start button (owner, 2026-10-25): scoring and the week, one row.
function GateLinks({ howOpen, onHow }) {
  return (
    <div className="pcg-row">
      <button type="button" className="pcg-how-b" aria-expanded={howOpen} onClick={onHow}>{howOpen ? 'Hide scoring' : 'How scoring works'}</button>
      <a className="pcg-wk" href="/pricecheck/week">Your week</a>
    </div>
  );
}

export default function PriceCheckClient({ dateLabel, dateShort, sections: rawSections = [] }) {
  // Each tag takes its ladder step (slot) for the stage colours.
  const sections = useMemo(() => rawSections.map((s, i) => ({ ...s, slot: i })), [rawSections]);
  const N = sections.length;
  const MAX = N * 10;
  const V2 = isV2(sections[0] && sections[0].quizId);
  const RTAG = ranksTag(sections[0] && sections[0].quizId);
  const RANKS = ranksFor(sections[0] && sections[0].quizId);
  const STORE = `sot_run_${RUN_ID}_${etToday()}`;
  const [look] = useGauntletLook();
  const darkLook = isDarkLook(look);
  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [howOpen, setHowOpen] = useState(false);
  const [between, setBetween] = useState(null);
  const [hold, setHold] = useState(false);
  const [resumes, setResumes] = useState(0);
  const doneAtLoad = useRef(null);
  const [showItems, setShowItems] = useState(false);
  const [itemAt, setItemAt] = useState(0);
  const [nudge, setNudge] = useState(false);
  const itemsShown = useRef(false);
  const countedRef = useRef([]);
  const [copied, setCopied] = useState(false);
  const [similar, setSimilar] = useState(null);

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
  // The week (owner, 2026-10-25), read a few seconds after the ending opens so
  // the last tag's row has been filed and today's run is in it.
  const [weekOn, setWeekOn] = useState(false);
  useEffect(() => { if (!(hydrated && done)) return undefined; const t = setTimeout(() => setWeekOn(true), 2500); return () => clearTimeout(t); }, [hydrated, done]);
  const week = useShopWeek(weekOn);
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
  const scaled = (v) => Math.round(v * 50 / Math.max(1, MAX));
  const rank = runRankOf(scaled(total), RANKS);
  const tier = runTierOf(scaled(total), RANKS);

  function start() {
    commit({ ...rRef.current, phase: 'playing', si: 0, t0: rRef.current.t0 || Date.now() });
    try { window.scrollTo(0, 0); } catch (e) {}
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
    setHold(false);
    setBetween({ si: cur.si, last });
  }
  // THE LAST TAG ROLLS STRAIGHT INTO THE FINALE (owner, 2026-10-01): no
  // "Final prices" press. The last score and price hold for a beat so the
  // player sees them, then the ending starts on its own.
  const FINALE_BEAT = 1800;
  useEffect(() => {
    if (!between) return undefined;
    const t = setTimeout(() => { try { window.scrollTo(0, 0); } catch (e) {} }, 40);
    return () => clearTimeout(t);
  }, [between]);
  useEffect(() => {
    if (!between || !between.last) return undefined;
    const t = setTimeout(() => advance(), FINALE_BEAT);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [between]);
  // The card between two tags starts the next one on its own unless held.
  useEffect(() => {
    if (!between || between.last || hold) return undefined;
    const t = setTimeout(() => advance(), BETWEEN_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [between, hold, resumes]);
  function advance() {
    const cur = rRef.current;
    setBetween(null);
    setHold(false);
    if (cur.si >= N - 1) commit({ ...cur, phase: 'done', tEnd: Date.now() });
    else commit({ ...cur, si: cur.si + 1 });
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  // The items pop-up: ten seconds after the ending comes up, once, and only
  // for a run finished in this sitting. Stamped rather than timed here, so it
  // opens wherever the player has gone (PriceCheckItemsGlobal in app/layout.js).
  const finaleOver = useCallback(() => {
    if (itemsShown.current) return;
    itemsShown.current = true;
    scheduleItems(itemsFor(sections, countedRef.current));
  }, [sections]);
  useEffect(() => {
    if (hydrated && done && doneAtLoad.current === false) finaleOver();
  }, [hydrated, done, finaleOver]);
  function closeItems() { setShowItems(false); setNudge(true); }
  function openItems() { spendItems(); setItemAt(0); setShowItems(true); }

  // One quick play next: the first run in the more-runs order not finished
  // today, as on the Gauntlet's ending. Read in an effect (local saves).
  useEffect(() => {
    if (!done) return;
    const id = otherRuns(RUN_ID).find((x) => !runDoneToday(x));
    setSimilar(id && RUN_DOORS[id] ? { name: RUN_DOORS[id].name, href: RUN_DOORS[id].href } : null);
  }, [done]);

  function shareText() {
    const per = sections.map((s, i) => `${s.name} ${counted[i] ? counted[i].score : '-'}`).join(' · ');
    const code = sections.map((s, i) => (counted[i] ? counted[i].score : 0)).join('-');
    return `Price Check · ${dateShort} · ${total}/${MAX}\nI paid with the ${rank[3]} card: ${rank[1]}.\n${per}\n${withRef(`mindloftdaily.com/pricecheck?s=${code}${RTAG ? `&r=${RTAG}` : ''}`)}`;
  }
  function copyShare() {
    const text = done ? shareText() : `Price Check: five real prices, from Amazon to the auction block. Three guesses at each, and the first one counts most.\n${withRef('mindloftdaily.com/pricecheck')}`;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const sec = playing ? sections[r.si] : null;
  const secBanked = sec ? banked[sec.key] : null;
  const runSoFar = sections.slice(0, r.si).reduce((a, s, i) => a + (counted[i] ? counted[i].score : 0), 0);

  // What the card says about the tag just played.
  function tagBody(i) {
    const s = sections[i];
    const c = counted[i];
    if (!s) return null;
    const guessLine = !c ? null
      : V2 && c.at >= 0 && c.best != null
        ? (c.at === 0 ? <span>First guess <b>{fmtCents(c.best)}</b> earned it</span> : <span>Earned on guess {c.at + 1} at <b>{fmtCents(c.best)}</b>{typeof c.first === 'number' ? <>, first guess {fmtCents(c.first)}</> : null}</span>)
        : typeof c.first === 'number' ? <span>Your first guess was <b>{fmtCents(c.first)}</b>{c.best != null && c.best !== c.first ? <>, closest {fmtCents(c.best)}</> : null}</span> : null;
    return (
      <>
        <b>{s.name}: the price was {fmtCents(s.day.price)}</b>
        {s.day.local ? <span>Listed at {s.day.local}, shown in US dollars</span> : null}
        {guessLine}
        {c && c.banked ? <span>Your first play today counts</span> : null}
      </>
    );
  }

  // THE SHOPPER LADDER (owner, 2026-10-25): the real cards from lib/price-games,
  // bottom to top, each cutoff put back on this run's own total (the persona is
  // graded on the total scaled to 50).
  const ladder = useMemo(() => RANKS.slice().reverse().map((t, k) => {
    const ti = RANKS.length - 1 - k;
    const min = t[0] <= 0 ? 0 : Math.ceil((t[0] - 0.5) * MAX / 50);
    return { min, name: `${t[1]} \u00b7\u00a0${t[3]}\u00a0card`, line: t[2], colour: rampFor(k), chip: CARD_COL[ti] ? CARD_COL[ti][0] : undefined, ti, card: <PayCard ti={ti} mini /> };
  }), [RANKS, MAX]);
  const earned = ladder.find((x) => x.ti === tier) || ladder[0];

  const data = board && board.data;
  const me = data && data.me;
  const overall = (data && Array.isArray(data.overall)) ? data.overall : [];
  const fieldSize = data ? (data.uniquePlayers || overall.length || null) : null;
  const per = (data && data.priceField && data.priceField.games) || {};
  const rowsIn = sections.map((s, i) => {
    const g = per[s.key];
    const bests = overall.map((L) => L.perGame && L.perGame[s.key] && !L.perGame[s.key].abandoned ? Number(L.perGame[s.key].score) : null).filter((v) => Number.isFinite(v));
    return {
      key: s.key, name: s.name, bg: rampFor(i),
      you: counted[i] ? counted[i].score : '–',
      field: g && g.avg != null ? (g.avg < 10 ? Number(g.avg).toFixed(1) : Math.round(g.avg)) : '–',
      best: bests.length ? Math.max(...bests) : '–',
    };
  });
  const boardRows = (() => {
    const isMe = (row) => !!(me && row && me.userKey && row.userKey === me.userKey);
    const out = overall.slice(0, 3).map((row, i) => ({ rank: row.rank || i + 1, name: row.username || 'Guest', score: Math.round(Number(row.total) || 0), me: isMe(row) }));
    if (me && !out.some((x) => x.me) && Number.isFinite(Number(me.total))) {
      if (Number.isFinite(me.rank) && me.rank > 4) out.push({ gap: true });
      out.push({ rank: Number.isFinite(me.rank) ? me.rank : '–', name: 'You', score: Math.round(Number(me.total) || 0), me: true });
    }
    return out.length ? { rows: out, field: fieldSize, href: '/pricecheck/leaderboard' } : null;
  })();

  // The play page's accent is the stage's one ink; the Guess button carries
  // the ground's colour on it, so nothing white sits on the pastel.
  const onramp = darkLook ? '#0b0f1a' : look === 'color' && sec ? softGround(rampFor(sec.slot)) : '#ffffff';
  const accVars = darkLook
    ? { '--stg-acc': '#e9edf4', '--stg-acc-ink': '#e9edf4', '--stg-onramp': onramp }
    : { '--stg-acc': RAMP_INK, '--stg-acc-ink': RAMP_INK, '--stg-onramp': onramp };

  return (
    <div className={`stage-page pc${darkLook ? '' : ' pc-light'}`} data-sot-wait="" data-stage-theme={darkLook ? 'dark' : 'light'} data-stage-pin="" style={{ fontFamily: SANS }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <RunChallengeCapture gameKey="pricecheck" />
      {!hydrated ? <GauntletCover sections={sections} /> : null}

      {hydrated && r.phase === 'idle' && (
        <GauntletGate
          circuitName="Price Check"
          dateLabel={dateLabel}
          sections={sections}
          lineFor={(s) => s.word}
          bandNote={(s) => (banked[s.key] ? `Played ${banked[s.key].score}` : '10 pts')}
          headline={<>{NUMS[N] || N} Prices.<br />{V2 ? 'Three' : 'Five'} Guesses Each.</>}
          rule={V2 ? 'The first guess counts most. Scored out of ' + MAX + '.' : 'Get warm, get close, then go big. Scored out of ' + MAX + '.'}
          lineup={null}
          startLabel="Start the run"
          banner={<ChallengeStrip gameKey="pricecheck" num={runToken()} run />}
          centerpiece={<Register v2={V2} max={MAX} n={N} sections={sections} howOpen={howOpen} onHow={() => setHowOpen((v) => !v)} />}
          after={<GateLinks howOpen={howOpen} onHow={() => setHowOpen((v) => !v)} />}
          onStart={start}
        />
      )}

      {hydrated && playing && sec && between && !between.last && sections[r.si + 1] && (
        <GauntletBetween
          circuitName="Price Check"
          sections={sections}
          lastSec={sec}
          upNext={sections[r.si + 1]}
          upIdx={r.si + 1}
          stepWord="Tag"
          doneCount={r.si + 1}
          lastBody={tagBody(r.si)}
          lastExtra={V2 && counted[r.si] && typeof counted[r.si].first === 'number'
            ? <PriceCrowd quizId={sec.quizId} price={sec.day.price} first={counted[r.si].first} compact /> : null}
          lastFig={{ v: counted[r.si] ? counted[r.si].score : 0, unit: 'of 10' }}
          nextLine={`${sections[r.si + 1].word}${sections[r.si + 1].chip ? ` · ${sections[r.si + 1].chip}` : ''}`}
          fine={`Run total ${runSoFar + (counted[r.si] ? counted[r.si].score : 0)} of ${MAX}`}
          dwellMs={BETWEEN_MS}
          held={hold}
          resetKey={`${r.si}:${resumes}`}
          onGo={advance}
          onHold={() => { if (hold) setResumes((k) => k + 1); setHold(!hold); }}
          leaveHref="/"
        />
      )}

      {hydrated && playing && sec && !(between && !between.last) && (
        <RunPlayFrame sections={sections} idx={r.si} title="Price Check" sub={`Tag ${r.si + 1} of ${N} · ${sec.name}`}
          foot={<>Run total {runSoFar + (between ? (counted[r.si] ? counted[r.si].score : 0) : 0)} of {MAX} · {dateShort}</>}>
          <section className={`pc-play pc-k-${sec.key}`} style={accVars}>
            {!between ? <div className="pc-chs"><ChallengeStrip gameKey="pricecheck" num={runToken()} run /></div> : null}
            {secBanked && !between && (
              <div className="pc-banked">You played {sec.name} today and scored <b>{secBanked.score}/10</b>. That score counts. Guess again for fun.</div>
            )}
            {!between && (
              <PriceGame key={`${sec.key}-${r.si}`} game={sec.key} puzzles={sec.puzzles} dayByNum={{ [sec.num]: sec.day }} forceNum={sec.num}
                run={{ practice: !!secBanked, onDone: onSectionDone }} />
            )}
            {between && between.last && (
              <div className="pc-last" role="status">
                <div className="pc-lastc">
                  <span className="pc-lastt">{tagBody(r.si)}</span>
                  <span className="pc-lastf">{counted[r.si] ? counted[r.si].score : 0}<i>of 10</i></span>
                </div>
                <div className="pc-rolling">Ringing up your card<span className="pc-dots" aria-hidden="true"><i /><i /><i /></span></div>
              </div>
            )}
          </section>
        </RunPlayFrame>
      )}

      {hydrated && done && (
        <GauntletEndStage
          circuitName="Price Check"
          dateLabel={dateLabel}
          sections={sections}
          results={sections.map((s, i) => ({ key: s.key, score: counted[i] ? counted[i].score : '–' }))}
          score={total}
          unitWord="points"
          colLabel="Tag"
          title={{ name: earned.name, line: earned.line, colour: earned.colour }}
          ladder={ladder}
          ladderHeading="Which card are you paying with?"
          prize={<PayCard ti={tier} label={rank[3]} name={rank[1]} total={total} max={MAX} sheen />}
          rank={me && Number.isFinite(me.rank) ? me.rank : null}
          fieldSize={fieldSize}
          board={boardRows}
          rowsIn={rowsIn}
          avg={Object.keys(per).length ? Object.fromEntries(sections.map((s) => [s.key, per[s.key] && per[s.key].avg != null ? per[s.key].avg : 0])) : null}
          leaderScore={overall[0] ? Math.round(Number(overall[0].total) || 0) : null}
          afterBoard={week ? <WeekStrip data={week} /> : null}
          extra={<button type="button" className="pc-items" onClick={openItems}>Today&rsquo;s tags <span aria-hidden="true">&rarr;</span></button>}
          challenge={(
            <div className="pc-chal">
              <RunChallengeLine gameKey="pricecheck" score={total} n={runToken()} />
              <RunChallengeButton gameKey="pricecheck" score={total} total={MAX} n={runToken()} status={`${rank[3]} card`} door />
            </div>
          )}
          meme={<RunMeme gameKey="pricecheck" score={total} total={MAX} n={runToken()} status={`${rank[3]} card`} cat="Trivia" />}
          similar={similar}
          more={<MoreRunsList self="pricecheck" ink="var(--gsx-ink)" mute="var(--gsx-ink)" line="color-mix(in srgb, var(--gsx-ink) 30%, transparent)" style={{ margin: 0 }} />}
          onShare={copyShare}
          copied={copied}
          sweep={doneAtLoad.current === false}
        />
      )}

      {showItems && (
        <ItemsPop items={itemsFor(sections, counted)} at={itemAt} setAt={setItemAt} onClose={closeItems} closeLabel="Back to your results" />
      )}
      <MoreRunsPop self="pricecheck" ready={nudge} delay={10000} fireOnLeave />
    </div>
  );
}

const CSS = `
.pc *{box-sizing:border-box}
.pc{min-height:100vh;overflow-x:hidden;position:relative}
/* THE ENTRY'S REGISTER: one compact box in the stage's ink. */
.pcg{display:flex;flex-direction:column;justify-content:center;gap:8px;width:100%;color:var(--gsx-ink)}
.pcg-box{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:78px;padding:10px 12px;border:2px solid var(--gsx-ink);border-radius:16px}
.pcg-box small{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.8}
.pcg .odo{display:inline-flex;align-items:center;gap:2px;font:800 34px/1.15em ${SANS};font-variant-numeric:tabular-nums}
.pcg .odo .d{display:inline-block;width:.66em;height:1.15em;overflow:hidden;position:relative;vertical-align:top}
.pcg .odo .d i{position:absolute;left:0;right:0;top:0;font-style:normal;display:flex;flex-direction:column;animation:pcspin 1.6s steps(10) infinite}
.pcg .odo .d i b{display:block;height:1.15em;line-height:1.15em;text-align:center}
.pcg .odo .q{opacity:.7}
@keyframes pcspin{from{transform:translateY(0)}to{transform:translateY(-11.5em)}}
.pcg-how{display:flex;flex-direction:column;gap:6px;width:100%}
.pcg-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;text-align:center}
.pcg-facts span{display:flex;flex-direction:column;font-size:11px;font-weight:700;line-height:1.2}
.pcg-facts b{font-size:20px;font-weight:800}
.pcg-how p{margin:0;font-size:12.5px;font-weight:600;line-height:1.35;text-align:center}
.pcg-note{font-size:13px;font-weight:700;text-align:center;line-height:1.3}
.pcg-row{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:2px 18px;font-size:13px;font-weight:700;margin-top:8px;color:var(--gsx-ink)}
.pcg-how-b{background:none;border:0;padding:4px 0;color:inherit;font:inherit;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.pcg-wk{color:inherit;font-weight:800}
@media(max-width:899px){.gsx-gate .gsx-piece .pcg{flex:1}}
@media(max-width:380px){.pcg .odo{font-size:28px}}
@media(min-width:900px){
  .pcg .odo{font-size:44px}.pcg-box{min-height:110px}.pcg-note{font-size:14px}
  /* Desktop: the title and Start on the left, the register over the tags on the right. */
  .pc .gsx-gate.gsx-cp .gsx-split{grid-template-rows:auto auto;row-gap:18px}
  .pc .gsx-gate.gsx-cp .gsx-head{grid-column:1;grid-row:1 / span 2;align-self:center}
  .pc .gsx-gate.gsx-cp .gsx-piece{grid-column:2;grid-row:1;display:flex}
  .pc .gsx-gate.gsx-cp .gsx-bands{grid-column:2;grid-row:2}
  .pc .gsx-gate.gsx-cp .gsx-band{min-height:58px}
}
/* Phone: the register box grows into the room the tags leave. */
@media(max-width:899px){.gsx-gate .gsx-piece .pcg-box{flex:1 1 auto;max-height:200px}.gsx-gate .gsx-piece .pcg{justify-content:center}}
/* PLAY: the price game inside the stage frame. The run used to force the
   engine's dark panels; on a light look they follow the light register. */
.pc-play{max-width:600px;margin:0 auto;padding:4px 14px 20px}
.pc-light .pc-play .pg-run{--pr-freezing:#0369a1 !important;--pr-cold:#1d4ed8 !important;--pr-cool:#6d28d9 !important;--pr-warm:#a16207 !important;--pr-hot:#c2410c !important;--pr-burning:#b91c1c !important}
.pc-light .pc-play:not(.pc-k-pricer) .pg-run{--pr-mat:#ece8df !important}
.pc-chs{margin:0 -14px 10px}
.pc-chs:empty{display:none}
.pc-light .pc-play{--stg-mute:#23404f;--stg-line:rgba(8,34,46,.22);--stg-line2:rgba(8,34,46,.4);--stg-cell-line:rgba(8,34,46,.45);--stg-ink:#08222e}
.pc-play .pr-money{min-width:0}
/* THE PRICE GAME ON THE STAGE (owner, 2026-10-25: "the selection elements and
   picture bubble in price check also need to match rest of aesthetic"). The
   same objects the gauntlet stage draws: 2px ink outlines, a faint ink tile in
   place of white panels, no drop shadows, Manrope only. The product photos
   themselves keep their own mat. */
.pc-play .pg-run{--pr-panel:color-mix(in srgb, var(--gsx-ink, #08222e) 7%, transparent) !important;--pr-panel-line:var(--gsx-ink, #08222e) !important;--pr-shadow:none !important}
.pc-play .pr-prod,.pc-play .pr-prod.hero{border:2px solid var(--gsx-ink, currentColor);border-radius:18px;box-shadow:none;background:var(--pr-panel)}
.pc-play .pg-hero{border-radius:12px;border:2px solid var(--gsx-ink, currentColor);box-sizing:border-box;background:#ffffff}
.pc-play .pg-lab,.pc-play .pg-thumbs span{font-family:${SANS};font-weight:800;letter-spacing:.06em;background:var(--gsx-ink, #08222e);color:var(--gsx-bg, #ffffff)}
.pc-play .pg-thumbs{gap:8px;margin-top:8px}
.pc-play .pg-thumbs button{border:2px solid color-mix(in srgb, var(--gsx-ink, #08222e) 35%, transparent);border-radius:12px;background:#ffffff;height:64px}
.pc-play .pg-thumbs button.on{border:3px solid var(--gsx-ink, #08222e)}
.pc-play .pr-eb,.pc-play .pr-row .n,.pc-play .pr-row .heat b{font-family:${SANS};font-weight:800}
.pc-play .pr-eb{color:var(--gsx-ink, currentColor) !important;opacity:.8}
.pc-play .pg-facts span{border:2px solid var(--gsx-ink, currentColor);background:transparent;color:var(--gsx-ink, currentColor)}
.pc-play .pr-money{border:2px solid var(--gsx-ink, currentColor);border-radius:16px;box-shadow:none;background:var(--pr-panel)}
.pc-play .pr-go{border-radius:16px;box-shadow:none;background:var(--gsx-ink, #08222e);color:var(--gsx-bg, #ffffff)}
.pc-play .pr-row{border:2px solid var(--gsx-ink, currentColor);border-left:6px solid var(--row-c, var(--gsx-ink, currentColor));border-radius:14px;box-shadow:none}
.pc-play .pr-slot{border:2px solid color-mix(in srgb, var(--gsx-ink, #08222e) 22%, transparent);background:transparent}
.pc-play .pr-slot.next{border:2px solid var(--gsx-ink, currentColor);background:var(--pr-panel)}
.pc-play .pr-slot.used{border:2px solid var(--row-c);background:color-mix(in srgb, var(--row-c) 14%, transparent)}
.pc-play .pr-slot .sk,.pc-play .pr-slot .sw,.pc-play .pr-slot .sp{color:var(--gsx-ink, currentColor);opacity:.75}
.pc-play .pr-slot.next .sk,.pc-play .pr-slot.next .sw{opacity:1}
.pc-play .pr-slot .sv{color:var(--gsx-ink, currentColor)}
.pc-play .pr-stop{border:2px solid var(--gsx-ink, currentColor);color:var(--gsx-ink, currentColor)}
.pc-play .pc-banked{border-color:var(--gsx-ink, currentColor)}
.pc-play .pr-go{flex:none}
.pc-banked{margin:0 0 12px;padding:10px 12px;border:2px solid currentColor;border-radius:12px;font-size:13px;font-weight:700;line-height:1.35}
.pc-last{display:flex;flex-direction:column;align-items:center;gap:16px;padding:18px 0 8px;animation:pcrise .4s ease both}
.pc-lastc{display:flex;align-items:center;gap:14px;width:100%;padding:14px 16px;border-radius:16px;border:2px solid currentColor}
.pc-lastt{flex:1;display:flex;flex-direction:column;gap:3px;font-size:13px;font-weight:600;min-width:0}
.pc-lastt b{font-weight:800;font-size:15px}
.pc-lastf{font-size:30px;font-weight:800;line-height:1;text-align:right;font-variant-numeric:tabular-nums}
.pc-lastf i{display:block;font-style:normal;font-size:12px;font-weight:700;opacity:.75}
.pc-rolling{display:inline-flex;align-items:center;gap:10px;font:800 15px ${SANS}}
.pc-dots{display:inline-flex;gap:5px}
.pc-dots i{width:6px;height:6px;border-radius:50%;background:currentColor;animation:pcdot 1s ease-in-out infinite}
.pc-dots i:nth-child(2){animation-delay:.15s}.pc-dots i:nth-child(3){animation-delay:.3s}
@keyframes pcdot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
@keyframes pcrise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
/* END: the "Today's tags" button and the challenge, in the ending's dark tray. */
.pc-items{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:46px;border-radius:12px;border:2px solid #e9edf4;background:transparent;color:#e9edf4;font:800 15px ${SANS};cursor:pointer}
.pc-items:hover{background:rgba(233,237,244,.12)}
.pc-chal{display:flex;flex-direction:column;gap:10px}
@media(prefers-reduced-motion:reduce){.pc *{animation-duration:.01ms !important;animation-iteration-count:1 !important}}
`;
