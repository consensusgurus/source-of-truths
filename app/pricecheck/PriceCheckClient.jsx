'use client';

// PRICE CHECK — the five price games as one run (owner, 2026-10-01).
//
// Pricer, Dealer, Realtor, Agent and Curator back to back, five guesses at
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
// odometer that never lands, Start with a sheen. THE ENDING is a departures
// board (owner, 2026-10-01, "not a receipt"): each tag's points flip in, the
// total rolls, a gavel lands and SOLD stamps the rank; on 30 or more the room
// raises its paddles. Five seconds later the five items come up in one pop-up
// (Pricer's reveal, kept), and closing it offers the Trivia Gauntlet if that
// run has not been finished today.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { X, ExternalLink, Sun, Moon } from 'lucide-react';
import PriceGame, { readDoneSave } from '../price/PriceGame';
import RunNudgePop from '../circuits/RunNudgePop';
import useCircuitBoard from '../circuits/useCircuitBoard';
import { useStageTheme } from '@/lib/stage-theme';
import { withRef } from '@/lib/referrals';
import { isMobileDevice } from '@/lib/is-mobile';
import { PRICE_GAMES, errOf, scoreOf, fmtCents, runRankOf } from '@/lib/price-games';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const RUN_ID = 'pricecheck';
const ITEMS_DELAY = 5000;

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
const freshRun = () => ({ v: 1, phase: 'idle', si: 0, t0: null, results: {} });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The first (counted) play of a game today, read off its own solo save.
function bankedOf(sec) {
  const s = readDoneSave(sec.key, sec.num);
  if (!s || !s.guesses.length) return null;
  const errs = s.guesses.map((c) => errOf(c, sec.day.price));
  const i = errs.indexOf(Math.min(...errs));
  return { score: scoreOf(errs[i]), best: s.guesses[i], guesses: s.guesses.length, secs: s.t0 && s.tEnd ? Math.round((s.tEnd - s.t0) / 1000) : 0, banked: true };
}

export default function PriceCheckClient({ dateLabel, dateShort, sections = [] }) {
  const N = sections.length;
  const MAX = N * 10;
  const STORE = `sot_run_${RUN_ID}_${etToday()}`;
  const [theme, setTheme] = useStageTheme();
  const dark = theme !== 'light';
  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [leaving, setLeaving] = useState(false);
  const [between, setBetween] = useState(null);
  const doneAtLoad = useRef(null);
  const [showItems, setShowItems] = useState(false);
  const [itemAt, setItemAt] = useState(0);
  const [nudge, setNudge] = useState(false);
  const itemsShown = useRef(false);
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
  const board = useCircuitBoard(RUN_ID, hydrated && done);

  // What counts for each tag: the first play of the day, wherever it happened.
  const counted = useMemo(() => sections.map((sec) => {
    const b = banked[sec.key];
    const res = r.results[sec.key];
    if (b) return { ...b, practiceScore: res && res.practice ? res.score : null };
    if (res) return res;
    return null;
  }), [sections, banked, r.results]);
  const total = counted.reduce((a, c) => a + (c ? c.score : 0), 0);
  const rank = runRankOf(Math.round(total * 50 / Math.max(1, MAX)));

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
    const best = res.guesses.length ? res.guesses.reduce((m, c) => (errOf(c, sec.day.price) < errOf(m, sec.day.price) ? c : m)) : null;
    const results = { ...cur.results, [sec.key]: { score: res.score, best, guesses: res.guesses.length, secs: res.secs, practice: !!res.practice } };
    const last = cur.si >= N - 1;
    const next = { ...cur, results };
    commit(next);
    setBetween({ si: cur.si, last });
  }
  function advance() {
    const cur = rRef.current;
    setBetween(null);
    if (cur.si >= N - 1) commit({ ...cur, phase: 'done', tEnd: Date.now() });
    else commit({ ...cur, si: cur.si + 1 });
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }

  // The items pop-up: five seconds after the ending settles, once per load,
  // and only for a run finished in this sitting.
  const finaleOver = useCallback(() => {
    if (itemsShown.current) return;
    itemsShown.current = true;
    setTimeout(() => { setItemAt(0); setShowItems(true); }, ITEMS_DELAY);
  }, []);
  function closeItems() { setShowItems(false); setNudge(true); }

  function shareText() {
    const per = sections.map((s, i) => `${s.name} ${counted[i] ? counted[i].score : '-'}`).join(' · ');
    const code = sections.map((s, i) => (counted[i] ? counted[i].score : 0)).join('-');
    return `Price Check · ${dateShort} · ${total}/${MAX} · ${rank[1]}\n${per}\n${withRef(`mindloftdaily.com/pricecheck?s=${code}`)}`;
  }
  function copyShare() {
    const text = done ? shareText() : `Price Check: five real prices, from Amazon to the auction block. Five guesses at each.\n${withRef('mindloftdaily.com/pricecheck')}`;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const tagCol = (key) => (dark ? PRICE_GAMES[key].tagDark : PRICE_GAMES[key].tagLight);
  const VARS = dark
    ? { '--pc-ground': '#0b0f1a', '--pc-panel': '#181e2d', '--pc-line': 'rgba(255,255,255,.22)', '--pc-ink': '#e9edf4', '--pc-mute': '#8b95a8', '--pc-rail': '#3a4256', '--pc-shadow': '0 14px 34px rgba(0,0,0,.55)', '--pc-cta': '#fbbf24', '--pc-cta-ink': '#1f1300', '--pc-gold': '#fbbf24', '--pc-mat': '#ffffff' }
    : { '--pc-ground': '#f4f1ea', '--pc-panel': '#fffdf8', '--pc-line': 'rgba(11,15,26,.16)', '--pc-ink': '#0b0d12', '--pc-mute': '#5b6476', '--pc-rail': '#b9c0cd', '--pc-shadow': '0 12px 28px rgba(15,23,42,.14)', '--pc-cta': '#0b0d12', '--pc-cta-ink': '#ffffff', '--pc-gold': '#b45309', '--pc-mat': '#ffffff' };
  sections.forEach((s) => { VARS[`--pc-${s.key}`] = tagCol(s.key); });

  const sec = playing ? sections[r.si] : null;
  const secBanked = sec ? banked[sec.key] : null;

  return (
    <div className="stage-page pc" data-stage-theme={theme} style={{ ...VARS, minHeight: '100vh', background: 'var(--pc-ground)', color: 'var(--pc-ink)', fontFamily: SANS, overflowX: 'hidden', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pc-cap">
        <Link href="/" className="pc-home">Mind Loft</Link>
        <b>Price Check</b>
        <span className="pc-capd">{dateShort}</span>
        {playing && <span className="pc-capt">{sections.map((s, i) => <i key={s.key} className={i < r.si ? 'd' : i === r.si ? 'on' : ''} style={{ background: i <= r.si ? `var(--pc-${s.key})` : undefined }} title={s.name} />)}</span>}
        <button type="button" className="pc-theme" aria-label={dark ? 'Switch to light' : 'Switch to dark'} onClick={() => setTheme(dark ? 'light' : 'dark')}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
      </div>

      {hydrated && r.phase === 'idle' && (
        <section className={`pre${leaving ? ' leave' : ''}`}>
          <div className="eb fade">{dateLabel} · Price Check</div>
          <h1 className="title"><span>Price</span> <span>Check</span></h1>
          <div className="odo fade" aria-hidden="true"><span className="q">$</span>
            {['1234567890', '7391582640', '4086291537', ',', '9502738164', '2618407395', '5173094826'].map((d, i) => (
              d === ',' ? <span key={i} className="q">,</span>
                : <span key={i} className="d"><i style={{ animationDuration: `${[1.6, 1.1, 0.8, 0, 0.6, 0.45, 0.35][i]}s` }}>{d.split('').map((c, j) => <b key={j}>{c}</b>)}</i></span>
            ))}
          </div>
          <p className="lede fade">Five real price tags, from <b>pocket change</b> to <b>the auction block</b>. Five guesses at each. Get warm, get close, then go big.</p>
          <div className="rail" />
          <div className="tags">
            {sections.map((s, i) => (
              <div key={s.key} className="hang" style={{ animationDelay: `${0.25 + i * 0.12}s, ${0.9 + i * 0.15}s`, animationDuration: `.6s, ${3.3 + (i % 3) * 0.3}s` }}>
                <div className="string" />
                <div className="tag" style={{ '--c': `var(--pc-${s.key})` }}>
                  <div className="k">{String(i + 1).padStart(2, '0')} · {s.name}</div>
                  <div className="n">{s.word}</div>
                  <div className="chip">{s.chip}</div>
                  <div className="pq">$<em>{s.mask}</em></div>
                  {banked[s.key] && <div className="bk">Played: {banked[s.key].score}/10 counts</div>}
                </div>
              </div>
            ))}
          </div>
          <div className="facts fade">
            <div className="fact"><b>{N}</b><span>price tags</span></div>
            <div className="fact"><b>5</b><span>guesses each</span></div>
            <div className="fact"><b>{MAX}</b><span>points to win</span></div>
            <div className="fact"><b>1%</b><span>is a bullseye</span></div>
          </div>
          <div className="heat fade"><div className="bar" /><div className="lbl"><span>Freezing</span><span>Cold</span><span>Warm</span><span>Hot</span><span>Burning</span><span>Bullseye</span></div></div>
          <button type="button" className="start fade" onClick={start}>Start the run <span aria-hidden="true">&rarr;</span></button>
          <div className="sub2 fade">Each one is also its own daily: {sections.map((s, i) => <React.Fragment key={s.key}>{i ? ' · ' : ''}<a href={s.path}>{s.name}</a></React.Fragment>)}</div>
          <div className="sub2 fade">A game you already played today can be replayed here; your first score is the one that counts.</div>
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
              <div className="pc-bprice">The price was <b>{fmtCents(sec.day.price)}</b>{counted[r.si] && counted[r.si].best ? <>, your closest <b>{fmtCents(counted[r.si].best)}</b></> : null}.</div>
              {!between.last ? (
                <button type="button" className="start" onClick={advance}>Next: {sections[r.si + 1].name}, {sections[r.si + 1].word.toLowerCase()} <span aria-hidden="true">&rarr;</span></button>
              ) : (
                <button type="button" className="start" onClick={advance}>Final prices <span aria-hidden="true">&rarr;</span></button>
              )}
            </div>
          )}
        </section>
      )}

      {hydrated && done && (
        <Finale key="finale" sections={sections} counted={counted} total={total} max={MAX} rank={rank} dateLabel={dateLabel}
          animate={doneAtLoad.current === false} onOver={finaleOver} board={board}
          onShare={copyShare} copied={copied} onItems={() => { setItemAt(0); setShowItems(true); }} />
      )}

      {showItems && (
        <ItemsPop sections={sections} counted={counted} at={itemAt} setAt={setItemAt} onClose={closeItems} />
      )}
      <RunNudgePop target="gauntlet" ready={nudge} />
    </div>
  );
}

// ─── THE FINALE: departures board, gavel, SOLD ─────────────────────────────
const CH = ' 0123456789';
function mkFace(cell, ch) { cell.querySelector('.h.t span').textContent = ch; cell.querySelector('.h.b span').textContent = ch; }
function flipTo(cell, ch) {
  const old = cell.dataset.v || ' ';
  if (old === ch) return;
  cell.dataset.v = ch;
  cell.querySelector('.h.t span').textContent = ch;
  const ft = document.createElement('div'); ft.className = 'f top'; ft.innerHTML = '<span></span>'; ft.firstChild.textContent = old;
  const fb = document.createElement('div'); fb.className = 'f bot'; fb.innerHTML = '<span></span>'; fb.firstChild.textContent = ch;
  cell.append(ft, fb);
  setTimeout(() => { cell.querySelector('.h.b span').textContent = ch; ft.remove(); fb.remove(); }, 150);
}
function Cell({ v = ' ', big }) {
  return (
    <div className={`cell${big ? ' big' : ''}`} data-v={v}>
      <div className="h t"><span>{v}</span></div><div className="h b"><span>{v}</span></div><div className="seam" />
    </div>
  );
}

function Finale({ sections, counted, total, max, rank, dateLabel, animate, onOver, board, onShare, copied, onItems }) {
  const root = useRef(null);
  const [lit, setLit] = useState(animate ? -1 : sections.length);
  const [sold, setSold] = useState(!animate);
  const [after, setAfter] = useState(!animate);
  const [swing, setSwing] = useState(false);
  const [paddles, setPaddles] = useState([]);
  const pts = sections.map((s, i) => (counted[i] ? counted[i].score : 0));
  const pad = (n) => String(n).padStart(2, '0');

  useEffect(() => {
    let alive = true;
    const el = root.current;
    if (!el) return undefined;
    const rows = [...el.querySelectorAll('.pf-row .flaps')].map((f) => [...f.querySelectorAll('.cell')]);
    const tot = [...el.querySelectorAll('.pf-total .cellw .cell')];
    async function spin(cells, target, steps) {
      for (let s = 0; s < steps + cells.length * 3; s++) {
        if (!alive) return;
        cells.forEach((c, i) => { const stop = steps + i * 3; flipTo(c, s < stop ? CH[1 + ((s + i * 4) % 10)] : target[i]); });
        await sleep(75);
      }
    }
    if (!animate) {
      rows.forEach((cs, i) => cs.forEach((c, j) => { c.dataset.v = pad(pts[i])[j]; mkFace(c, pad(pts[i])[j]); }));
      tot.forEach((c, j) => { c.dataset.v = pad(total)[j]; mkFace(c, pad(total)[j]); });
      return () => { alive = false; };
    }
    (async () => {
      await sleep(500);
      for (let i = 0; i < rows.length; i++) {
        if (!alive) return;
        setLit(i);
        await spin(rows[i], pad(pts[i]), 6 + i);
        await sleep(160);
      }
      await sleep(250);
      await spin(tot, pad(total), 14);
      if (!alive) return;
      await sleep(350);
      setSwing(true);
      await sleep(500);
      if (!alive) return;
      try { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } catch (e) {}
      setSold(true);
      if (total * 50 / Math.max(1, max) >= 30) {
        const n = total * 50 / Math.max(1, max) >= 40 ? 14 : 8;
        setPaddles(Array.from({ length: n }, (_, i) => ({ i, x: (i + 0.5) / n * 100, rot: Math.random() * 24 - 12, num: 10 + Math.floor(Math.random() * 89), d: i * 70 + Math.random() * 120, k: sections[i % sections.length].key })));
      }
      await sleep(900);
      if (!alive) return;
      setAfter(true);
      onOver();
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const me = board && board.data && board.data.me;
  const field = board && board.data && Array.isArray(board.data.overall) ? (board.data.uniquePlayers || board.data.overall.length) : null;

  return (
    <section className="pf" ref={root}>
      <div className="eb">{dateLabel} · Price Check</div>
      <h1 className="pf-h">Final prices</h1>
      <div className="pf-bwrap">
        <div className="pf-board">
          <div className="pf-bhead"><span>ITEM</span><span>POINTS</span></div>
          {sections.map((s, i) => {
            const c = counted[i];
            return (
              <div key={s.key} className={`pf-row${lit >= i ? ' lit' : ''}${c && c.score === 10 && lit >= i ? ' bull' : ''}`}>
                <span className="pf-tag" style={{ background: `var(--pc-${s.key})` }}>{s.name}</span>
                <div className="pf-what">{s.day.revealName || s.day.name}
                  <small>{c && c.best ? `GUESS ${fmtCents(c.best)} · ` : ''}PRICE {fmtCents(s.day.price)}{c && c.banked ? ' · FIRST PLAY' : ''}</small>
                </div>
                <div className={`flaps${c && c.score === 10 && lit >= i ? ' gold' : ''}`}>
                  <Cell /><Cell />
                </div>
              </div>
            );
          })}
          <div className="pf-total">
            <div className="pf-totl">TOTAL<b>{sold ? rank[1] : ' '}</b></div>
            <div className="flaps">
              <span className="cellw t1"><Cell big /></span>
              <span className="cellw t2"><Cell big /></span>
              <span className="slash">/</span>
              {pad(max).split('').map((d, j) => <Cell key={j} big v={d} />)}
            </div>
          </div>
        </div>
        <div className={`gavel${swing ? ' swing' : ''}`} aria-hidden="true"><svg viewBox="0 0 220 120"><rect x="20" y="78" width="150" height="9" rx="4" fill="#8b5a2b" /><rect x="150" y="56" width="52" height="54" rx="9" fill="#6b3f1d" /><rect x="146" y="62" width="60" height="7" rx="3" fill="#c9a227" /><rect x="146" y="97" width="60" height="7" rx="3" fill="#c9a227" /></svg></div>
        <div className={`ring${swing ? ' go' : ''}`} aria-hidden="true" />
      </div>
      <div className={`sold${sold ? ' on' : ''}${animate ? '' : ' still'}`}><span className="w">SOLD</span><span className="r">{rank[1]} · {total} of {max}</span></div>
      <div className={`pf-after${after ? ' on' : ''}`}>
        <p className="verdict">{rank[2]}</p>
        {me && me.rank ? <p className="pf-rank">You are <b>#{me.rank}</b>{field ? <> of {Number(field).toLocaleString()}</> : null} on today&rsquo;s Price Check board.</p> : null}
        <div className="pf-btns">
          <button type="button" className="pri" onClick={onShare}>{copied ? 'Copied' : 'Share your board'}</button>
          <button type="button" onClick={onItems}>See the items</button>
          <a href="/circuits/pricecheck">Leaderboard</a>
          <a href="/">Back to main</a>
        </div>
      </div>
      <div className="paddles" aria-hidden="true">
        {paddles.map((p) => (
          <div key={p.i} className="pad up" style={{ left: `calc(${p.x}% - 23px)`, '--rot': `${p.rot}deg`, animationDelay: `${p.d}ms` }}>
            <div className="p" style={{ background: `var(--pc-${p.k})` }}>{p.num}</div><div className="s" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── THE ITEMS POP-UP: today's five, one at a time ──────────────────────────
function ItemsPop({ sections, counted, at, setAt, onClose }) {
  const tabsRef = useRef(null);
  const [arrows, setArrows] = useState({ l: false, r: false });
  const s = sections[at];
  const c = counted[at];
  const D = s.day;
  const measure = useCallback(() => {
    const t = tabsRef.current;
    if (!t) return;
    const over = t.scrollWidth > t.clientWidth + 2;
    setArrows({ l: over && t.scrollLeft > 4, r: over && t.scrollLeft + t.clientWidth < t.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    measure();
    const on = () => measure();
    window.addEventListener('resize', on);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setAt((at + 1) % sections.length);
      if (e.key === 'ArrowLeft') setAt((at + sections.length - 1) % sections.length);
    };
    window.addEventListener('keydown', onKey);
    try { const b = tabsRef.current && tabsRef.current.children[at]; if (b) b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {}
    const t = setTimeout(measure, 350);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [at, measure, onClose, sections.length, setAt]);
  return (
    <div className="ip" role="dialog" aria-modal="true" aria-label="Today's items">
      <div className="ip-scrim" onClick={onClose} />
      <div className="ip-card">
        <button type="button" className="ip-x" aria-label="Close" onClick={onClose}><X size={18} /></button>
        <div className={`ip-tabwrap${arrows.l ? ' fl' : ''}${arrows.r ? ' fr' : ''}`}>
          {arrows.l && <button type="button" className="ip-arr l" aria-label="Earlier tags" onClick={() => tabsRef.current.scrollBy({ left: -140, behavior: 'smooth' })}>&lsaquo;</button>}
          <div className="ip-tabs" ref={tabsRef} onScroll={measure}>
            {sections.map((x, i) => <button key={x.key} type="button" className={i === at ? 'on' : ''} style={{ background: `var(--pc-${x.key})` }} onClick={() => setAt(i)}>{x.name}</button>)}
          </div>
          {arrows.r && <button type="button" className="ip-arr r" aria-label="More tags" onClick={() => tabsRef.current.scrollBy({ left: 140, behavior: 'smooth' })}>&rsaquo;</button>}
        </div>
        <div className={`ip-img${D.fit === 'cover' ? ' cover' : ''}`}>{D.imgs && D.imgs[0] && <img src={D.imgs[0].src} alt={D.revealName || D.name} referrerPolicy="no-referrer" />}</div>
        <div className="ip-body">
          <div className="eb" style={{ color: `var(--pc-${s.key})` }}>{s.name} · {D.cat}</div>
          <h3>{D.revealName || D.name}</h3>
          {D.facts && D.facts.length > 0 && <div className="ip-meta">{D.facts.join(' · ')}</div>}
          <div className="ip-price"><b>{fmtCents(D.price)}</b><span>You scored {c ? c.score : 0} / 10</span></div>
          <div className="ip-asof">{D.asOf}</div>
          {D.credit && <div className="ip-credit">{D.creditUrl ? <a href={D.creditUrl} target="_blank" rel="noopener">{D.credit}</a> : D.credit}</div>}
          <div className="ip-act">
            <a href={D.href} target="_blank" rel={D.sponsored ? 'noopener sponsored' : 'noopener'}>{D.buy} <ExternalLink size={13} /></a>
            <button type="button" onClick={onClose}>Back to your results</button>
          </div>
          <div className="ip-nav">
            <button type="button" onClick={() => setAt((at + sections.length - 1) % sections.length)}>&larr; Prev</button>
            <span>{at + 1} of {sections.length}</span>
            <button type="button" onClick={() => setAt((at + 1) % sections.length)}>Next &rarr;</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.pc *{box-sizing:border-box}
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
@keyframes pcrise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
/* FINALE */
.pf{position:relative;z-index:2;max-width:560px;margin:0 auto;padding:18px 16px 70px;text-align:center}
.pf-h{margin:6px 0 18px;font-size:30px;font-weight:900;letter-spacing:-.02em}
.pf-bwrap{position:relative}
.pf-board{background:#05070d;border-radius:18px;padding:16px 14px 18px;box-shadow:var(--pc-shadow),inset 0 0 0 1px rgba(255,255,255,.06);position:relative;overflow:hidden;text-align:left}
.pf-board:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.015) 0 2px,transparent 2px 4px);pointer-events:none}
.pf-bhead{display:flex;justify-content:space-between;font:500 10px ${MONO};letter-spacing:.2em;color:#64748b;padding:0 4px 8px;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:10px}
.pf-row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:7px 4px;border-radius:10px;transition:background .5s}
.pf-row.lit{background:rgba(255,255,255,.04)}
.pf-row.bull{background:linear-gradient(90deg,rgba(251,191,36,.18),transparent)}
.pf-tag{font:800 11px ${SANS};letter-spacing:.06em;text-transform:uppercase;padding:5px 9px 5px 14px;border-radius:5px 7px 7px 5px;color:#0b0f1a;position:relative;min-width:84px;opacity:.25;transition:opacity .4s}
.pf-tag:before{content:"";position:absolute;left:5px;top:50%;width:4px;height:4px;margin-top:-2px;border-radius:50%;background:#05070d}
[data-stage-theme="light"] .pf-tag{color:#fff}
.pf-row.lit .pf-tag{opacity:1}
.pf-what{font:700 13px ${SANS};color:#cbd5e1;min-width:0;opacity:.25;transition:opacity .4s;overflow:hidden;text-overflow:ellipsis}
.pf-what small{display:block;font:500 10px ${MONO};color:#7c8aa0;letter-spacing:.04em;margin-top:2px}
.pf-row.lit .pf-what{opacity:1}
.pc .flaps{display:flex;gap:3px;align-items:center}
.pc .cell{position:relative;width:26px;height:38px;perspective:240px;font:500 26px/38px ${MONO};color:#f8fafc;text-align:center}
.pc .flaps.gold .cell{color:#fbbf24}
.pc .cell .h{position:absolute;left:0;right:0;height:50%;overflow:hidden;background:#1a2133;border-radius:4px 4px 0 0}
.pc .cell .h.b{top:50%;background:#141a29;border-radius:0 0 4px 4px}
.pc .cell .h span,.pc .cell .f span{position:absolute;left:0;right:0;height:200%;top:0}
.pc .cell .h.b span,.pc .cell .f.bot span{top:-100%}
.pc .cell .seam{position:absolute;left:0;right:0;top:50%;height:1px;background:#000;z-index:5}
.pc .cell .f{position:absolute;left:0;right:0;height:50%;overflow:hidden;backface-visibility:hidden;z-index:4}
.pc .cell .f.top{top:0;background:#1a2133;border-radius:4px 4px 0 0;transform-origin:bottom;animation:pcftop .07s ease-in forwards}
.pc .cell .f.bot{top:50%;background:#141a29;border-radius:0 0 4px 4px;transform-origin:top;transform:rotateX(90deg);animation:pcfbot .07s .07s ease-out forwards}
@keyframes pcftop{to{transform:rotateX(-90deg);filter:brightness(.6)}}
@keyframes pcfbot{to{transform:rotateX(0)}}
.pc .cell.big{width:44px;height:64px;font-size:46px;line-height:64px}
.cellw{display:inline-flex}
.pf-total{display:flex;align-items:flex-end;justify-content:space-between;margin-top:14px;padding:14px 4px 2px;border-top:1px dashed rgba(255,255,255,.12)}
.pf-totl{font:500 11px ${MONO};letter-spacing:.2em;color:#64748b}
.pf-totl b{display:block;font:800 13px ${SANS};letter-spacing:0;color:#cbd5e1;margin-top:4px}
.pf-total .slash{font:500 28px ${MONO};color:#475569;margin:0 4px}
.gavel{position:absolute;left:62%;bottom:0;width:0;height:0;z-index:20;pointer-events:none}
.gavel svg{position:absolute;left:-30px;bottom:-4px;width:220px;height:120px;transform-origin:200px 100px;transform:rotate(-70deg) translate(40px,-60px);opacity:0}
.gavel.swing svg{animation:pcswingg .62s cubic-bezier(.6,0,.9,.4) forwards,pcgone .5s 1.4s forwards}
@keyframes pcswingg{0%{opacity:0;transform:rotate(-70deg) translate(40px,-60px)}20%{opacity:1}78%{transform:rotate(0) translate(0,0)}86%{transform:rotate(-6deg) translate(0,-4px)}100%{opacity:1;transform:rotate(-2deg)}}
@keyframes pcgone{to{opacity:0;transform:rotate(-30deg) translate(30px,-40px)}}
.ring{position:absolute;left:calc(62% + 120px);bottom:-6px;width:40px;height:14px;margin-left:-20px;border:3px solid var(--pc-gold);border-radius:50%;opacity:0;pointer-events:none}
.ring.go{animation:pcring .7s .5s ease-out forwards}
@keyframes pcring{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(7)}}
.pf.shake{animation:pcshake .38s}
@keyframes pcshake{20%{transform:translate(-5px,3px)}40%{transform:translate(5px,-3px)}60%{transform:translate(-3px,2px)}80%{transform:translate(2px,-1px)}}
.sold{position:relative;margin:30px auto 0;text-align:center;opacity:0}
.sold.on{animation:pcpop .5s cubic-bezier(.2,1.6,.4,1) forwards}
.sold.on.still{animation:none;opacity:1;transform:rotate(-3deg)}
@keyframes pcpop{0%{opacity:0;transform:scale(2.2) rotate(-8deg)}100%{opacity:1;transform:scale(1) rotate(-3deg)}}
.sold .w{display:inline-block;font:900 54px/1 ${SANS};letter-spacing:.08em;color:var(--pc-gold);padding:10px 26px 8px;border:4px solid var(--pc-gold);border-radius:12px}
.sold .r{display:block;margin-top:12px;font:800 18px ${SANS};color:var(--pc-ink)}
.pf-after{opacity:0;transform:translateY(10px);transition:all .5s ease}
.pf-after.on{opacity:1;transform:none}
.verdict{color:var(--pc-mute);font-weight:600;font-size:15px;margin:12px auto 0;max-width:400px}
.pf-rank{font-weight:700;color:var(--pc-mute);margin:8px 0 0}
.pf-rank b{color:var(--pc-ink)}
.pf-btns{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:18px}
.pf-btns a,.pf-btns button{font:800 14px ${SANS};padding:12px 18px;border-radius:12px;text-decoration:none;color:var(--pc-ink);border:1px solid var(--pc-line);background:transparent;cursor:pointer}
.pf-btns .pri{background:var(--pc-cta);color:var(--pc-cta-ink);border-color:transparent;position:relative;overflow:hidden}
.paddles{position:fixed;left:0;right:0;bottom:0;height:0;pointer-events:none;z-index:-1}
.pad{position:absolute;bottom:-140px;width:46px}
.pad .p{width:46px;height:52px;border-radius:50% 50% 46% 46%;display:flex;align-items:center;justify-content:center;font:500 15px ${MONO};color:#0b0f1a;box-shadow:0 6px 14px rgba(0,0,0,.35)}
.pad .s{width:6px;height:70px;margin:0 auto;background:#8b5a2b;border-radius:3px}
.pad.up{animation:pcraise 2.6s cubic-bezier(.2,1.4,.4,1) both}
@keyframes pcraise{0%{transform:none}25%,70%{transform:translateY(-150px) rotate(var(--rot))}100%{transform:translateY(0)}}
/* ITEMS POP-UP */
.ip{position:fixed;inset:0;z-index:4050;display:flex;align-items:center;justify-content:center;padding:16px;animation:pcfade .35s ease both}
.ip-scrim{position:absolute;inset:0;background:rgba(5,7,13,.72);backdrop-filter:blur(3px)}
.ip-card{position:relative;width:100%;max-width:430px;max-height:92vh;overflow-y:auto;scrollbar-width:none;background:var(--pc-panel);border:1px solid var(--pc-line);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);animation:pcrise .45s cubic-bezier(.2,1.3,.4,1) both}
.ip-card::-webkit-scrollbar{display:none}
.ip-x{position:absolute;top:10px;right:10px;z-index:3;width:34px;height:34px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
.ip-tabwrap{position:relative;margin-right:46px}
.ip-tabs{display:flex;gap:6px;padding:12px 12px 0;overflow-x:auto;scrollbar-width:none;scroll-behavior:smooth}
.ip-tabs::-webkit-scrollbar{display:none}
.ip-tabs button{flex:0 0 auto;font:800 11px ${SANS};letter-spacing:.05em;text-transform:uppercase;border:0;border-radius:5px 7px 7px 5px;padding:6px 10px;cursor:pointer;color:#0b0f1a;opacity:.42;transition:opacity .2s,transform .2s}
[data-stage-theme="light"] .ip-tabs button{color:#fff}
.ip-tabs button.on{opacity:1;transform:translateY(-1px)}
.ip-arr{position:absolute;top:10px;width:30px;height:30px;border-radius:50%;border:0;background:var(--pc-panel);color:var(--pc-ink);font:800 16px ${SANS};box-shadow:0 2px 10px rgba(0,0,0,.35);cursor:pointer;z-index:2}
.ip-arr.l{left:4px}.ip-arr.r{right:-4px}
.ip-tabwrap:before,.ip-tabwrap:after{content:"";position:absolute;top:0;bottom:0;width:34px;pointer-events:none;opacity:0;transition:opacity .2s;z-index:1}
.ip-tabwrap:before{left:0;background:linear-gradient(90deg,var(--pc-panel),transparent)}
.ip-tabwrap:after{right:0;background:linear-gradient(270deg,var(--pc-panel),transparent)}
.ip-tabwrap.fl:before,.ip-tabwrap.fr:after{opacity:1}
.ip-img{margin:12px 12px 0;height:220px;border-radius:12px;background:var(--pc-mat);display:flex;align-items:center;justify-content:center;overflow:hidden}
.ip-img img{max-width:92%;max-height:92%;object-fit:contain}
.ip-img.cover img{max-width:none;max-height:none;width:100%;height:100%;object-fit:cover}
.ip-body{padding:14px 16px 14px;text-align:left}
.ip-body h3{margin:4px 0 2px;font-size:18px;font-weight:900;color:var(--pc-ink)}
.ip-meta{color:var(--pc-mute);font-weight:700;font-size:13px}
.ip-price{display:flex;align-items:baseline;gap:10px;margin:10px 0 2px;flex-wrap:wrap}
.ip-price b{font:500 28px ${MONO};color:var(--pc-ink)}
.ip-price span{font-weight:800;font-size:13px;color:var(--pc-mute)}
.ip-asof{font-size:12px;color:var(--pc-mute);font-weight:600;line-height:1.45}
.ip-credit{font-size:10.5px;color:var(--pc-mute);margin-top:4px}
.ip-credit a{color:var(--pc-mute)}
.ip-act{display:flex;gap:8px;margin-top:14px}
.ip-act a,.ip-act button{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-align:center;font:800 14px ${SANS};padding:11px 10px;border-radius:11px;text-decoration:none;cursor:pointer}
.ip-act a{background:#f0b23a;color:#1f1300;border:0}
.ip-act button{background:transparent;border:1px solid var(--pc-line);color:var(--pc-ink)}
.ip-nav{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font:700 12px ${SANS};color:var(--pc-mute)}
.ip-nav button{background:none;border:0;color:var(--pc-ink);font:800 13px ${SANS};cursor:pointer;padding:6px}
@keyframes pcfade{from{opacity:0}to{opacity:1}}
@media(max-width:600px){.tags{gap:4px}.tag{padding:20px 4px 10px}.tag .n{font-size:13px}.tag .k{font-size:8.5px;letter-spacing:.06em}.tag .chip{display:none}.tag .pq{font-size:12px}.string{height:22px}.fact{min-width:92px}.title{font-size:46px}}
@media(max-width:420px){.pc .cell{width:22px;height:34px;font-size:22px;line-height:34px}.pc .cell.big{width:36px;height:54px;font-size:38px;line-height:54px}.pf-tag{min-width:72px;font-size:10px}.pf-what{white-space:normal;font-size:12px}.sold .w{font-size:42px}.gavel{left:40%}.ring{left:calc(40% + 120px)}}
@media(prefers-reduced-motion:reduce){.pc *{animation-duration:.01ms !important;animation-iteration-count:1 !important}}
`;
