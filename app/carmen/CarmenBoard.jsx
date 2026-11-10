'use client';

// Carmen's board: the case file, the tips, the Noir globe, and the run-style
// interstitials (owner, 2026-11-08: "solid animations, like a run"). The shell
// (app/SimpleDaily.jsx) owns saves, the clock, posting and the ending; this
// draws and calls setS. Everything it animates is replayed from `s`, so a
// reload resumes the case at the start of the leg it was on.
//
// s = { leg, tips, guess, phase: 'play'|'reveal', res: [{ km, pts, tips, g }], closed }

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import CarmenGlobe, { loadWorld } from '@/lib/carmen-globe';
import { kmBetween, legPoints, grade, TIP_TAGS, maxPoints, caught, titleFor, CATCH_KM } from '@/lib/carmen-engine';

const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const short = (name) => String(name || '').split(',')[0];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

export function lastSeen(P, leg) { return leg === 0 ? P.start : P.legs[leg - 1]; }

// THE DESK LAYOUT (owner, 2026-11-09, mockup B "Dossier"): from 1000px wide
// the case runs as a dossier column on the left (suspect, legs, tips, result,
// her trail, the lock-in button) beside a dark panel that gives the globe the
// rest of the screen. Phones keep the stacked layout untouched (owner: "leave
// mobile unchanged"). The stage passes GAME.full so the column is 1180 wide.
const DESK_Q = '(min-width:1000px)';
export function useDesk() {
  const [d, setD] = useState(false);
  useEffect(() => {
    let mq = null;
    try { mq = window.matchMedia(DESK_Q); } catch (e) { return undefined; }
    const on = () => setD(!!mq.matches);
    on();
    try { mq.addEventListener('change', on); } catch (e) { mq.addListener(on); }
    return () => { try { mq.removeEventListener('change', on); } catch (e) { mq.removeListener(on); } };
  }, []);
  return d;
}
function lockIn(P, setS) {
  setS((st) => {
    if (st.phase !== 'play' || !st.guess) return st;
    const L = P.legs[st.leg];
    const km = Math.round(kmBetween(st.guess, L.ll));
    const pts = legPoints(km, st.tips);
    return { ...st, phase: 'reveal', res: [...st.res, { km, pts, tips: st.tips, g: st.guess }] };
  });
}
function nextLeg(P, setS) {
  setS((st) => {
    if (st.phase !== 'reveal') return st;
    if (st.res.length >= P.legs.length) return { ...st, closed: true };
    return { ...st, phase: 'play', leg: st.res.length, tips: 1, guess: null };
  });
}

// ---- the typed tip ----------------------------------------------------------
function TypedTip({ text, animate }) {
  const [n, setN] = useState(animate ? 0 : text.length);
  useEffect(() => {
    if (!animate || reduced()) { setN(text.length); return undefined; }
    let i = 0;
    const iv = setInterval(() => { i += 2; setN(Math.min(text.length, i)); if (i >= text.length) clearInterval(iv); }, 9);
    return () => clearInterval(iv);
  }, [text, animate]);
  return <span>{text.slice(0, n)}</span>;
}

// ---- interstitials -----------------------------------------------------------
// Curtains go to document.body: the stage column animates with a transform,
// which would otherwise make it the box a fixed curtain is drawn in.
function Portal({ children }) {
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(true); }, []);
  return on ? createPortal(children, document.body) : null;
}
function Curtain({ show, onSkip, children }) {
  if (!show) return null;
  return <Portal>{(
    <div className="cmn-cur" onClick={onSkip} role="dialog" aria-live="polite">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cmn-cur-in">{children}</div>
      <div className="cmn-skip">Tap to skip</div>
    </div>
  )}</Portal>;
}

function CaseFile({ P }) {
  const rows = [['Suspect', P.suspect], ['Stolen', P.stolen], ['Scene', P.start.name], ['Status', 'At large']];
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduced()) { setN(999); return undefined; }
    let i = 0;
    const iv = setInterval(() => { i += 1; setN(i); }, 24);
    return () => clearInterval(iv);
  }, []);
  let budget = n;
  return (
    <div className="cmn-file">
      <div className="cmn-tab">Case file {String(P.num).padStart(3, '0')}</div>
      {rows.map(([k, v]) => {
        const shown = Math.max(0, Math.min(v.length, budget)); budget -= v.length;
        return <div key={k} className="cmn-ln"><b>{k}</b><span>{v.slice(0, shown)}</span></div>;
      })}
      {budget > 4 ? <div className="cmn-bigstamp">OPEN</div> : null}
    </div>
  );
}

function LegCard({ P, leg }) {
  const n = P.legs.length, last = leg === n - 1;
  return (
    <div className="cmn-legcard">
      <div className="cmn-n">{last ? 'Final leg' : `Leg ${leg + 1} of ${n}`}</div>
      <div className="cmn-big">{last ? 'Closing in' : 'On the move'}</div>
      <div className="cmn-from">She left <b>{short(lastSeen(P, leg).name)}</b></div>
      <div className="cmn-q">Where did she go?</div>
      <div className="cmn-dots">{P.legs.map((_, i) => <i key={i} className={i < leg ? 'd' : i === leg ? 'c' : ''} />)}</div>
    </div>
  );
}

function Finale({ P, s, gaveUp }) {
  const last = s.res[s.res.length - 1];
  const got = !gaveUp && s.res.length === P.legs.length && last && caught(last.km);
  const city = short((P.legs[Math.max(0, s.res.length - 1)] || P.start).name);
  if (got) {
    return (
      <div className="cmn-catch">
        <div className="cmn-rings"><i /><i /><i /><b /></div>
        <div className="cmn-word">Caught!</div>
        <div className="cmn-where">Arrested in {city}</div>
      </div>
    );
  }
  return (
    <div className="cmn-catch">
      <div className="cmn-escape"><svg width="40" height="40" viewBox="-14 -14 28 28" aria-hidden="true"><circle r="13" fill="#fff" stroke="#16181d" strokeWidth="1.2" /><path d="M10 0 L-6 -7 L-3 0 L-6 7 Z" fill="#16181d" transform="rotate(-25)" /></svg></div>
      <div className="cmn-word sm">She got away</div>
      <div className="cmn-where">{gaveUp ? 'The trail went cold' : `Last seen leaving ${city}`}</div>
    </div>
  );
}

// The light show (owner: "solid animations, like a run"): the case stamp, a
// bar per leg, the total, then the rank ladder climbing to the title earned.
function CaseShow({ P, s, gaveUp, onDone }) {
  const legs = P.legs.length;
  const rows = P.legs.map((L, i) => s.res[i] || { km: null, pts: 0 });
  const total = rows.reduce((a, r) => a + (r.pts || 0), 0);
  const t = titleFor(total, legs);
  const last = s.res[s.res.length - 1];
  const got = !gaveUp && s.res.length === legs && last && caught(last.km);
  const [step, setStep] = useState(reduced() ? 99 : 0);
  const [shownTotal, setShownTotal] = useState(reduced() ? total : 0);
  useEffect(() => {
    if (reduced()) { const d = setTimeout(onDone, 2500); return () => clearTimeout(d); }
    let alive = true;
    (async () => {
      await sleep(700);
      for (let i = 1; i <= legs && alive; i++) { setStep(i); await sleep(330); }
      if (!alive) return;
      setStep(legs + 1);
      const t0 = performance.now();
      await new Promise((res) => {
        const f = () => { const p = Math.min(1, (performance.now() - t0) / 850); setShownTotal(Math.round(total * (1 - Math.pow(1 - p, 3)))); if (p < 1 && alive) requestAnimationFrame(f); else res(); };
        requestAnimationFrame(f);
      });
      for (let i = 0; i <= t.index && alive; i++) { setStep(legs + 2 + i); await sleep(280); }
      if (!alive) return;
      setStep(99);
      await sleep(1900);
      if (alive) onDone();
    })();
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const lit = step >= 99 ? t.index : step - legs - 2;
  return (
    <div className="cmn-show">
      <div className="cmn-closed"><span>{got ? 'CASE CLOSED' : 'CASE COLD'}</span></div>
      <div className="cmn-verdict">{got ? 'Caught!' : 'She got away'}</div>
      <div className="cmn-recap">
        {rows.map((r, i) => (
          <div key={i} className={'cmn-bar' + (step > i ? ' on' : '')}>
            <span className="c">{short(P.legs[i].name)}<small>{r.km == null ? 'skipped' : `${fmt(r.km)} km`}</small></span>
            <span className="tr"><span className="fl" style={{ width: step > i ? `${(r.pts || 0) / 10}%` : 0 }} /></span>
            <span className="v">{step > i ? fmt(r.pts) : 0}</span>
          </div>
        ))}
      </div>
      <div className={'cmn-total' + (step > legs ? ' on' : '')}><b>{fmt(shownTotal)}</b>points</div>
      <div className={'cmn-ladder' + (step > legs + 1 ? ' on' : '')}>
        {t.steps.map((st, i) => (
          <div key={st.title} className={'cmn-rung' + (i <= lit ? ' lit' : '') + (step >= 99 && i === t.index ? ' fin' : '')}>
            <span>{st.title}</span><small>{fmt(st.min)}+</small>
          </div>
        ))}
      </div>
      <div className={'cmn-title' + (step >= 99 ? ' on' : '')}>Rank earned: {t.title}</div>
    </div>
  );
}

// ---- the board ---------------------------------------------------------------
export default function CarmenBoard({ P, s, setS, active, done, onStage, held, release, gaveUp }) {
  const svgRef = useRef(null);
  const globe = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [curtain, setCurtain] = useState(null);   // 'file' | 'leg' | 'finale' | 'show'
  const [busy, setBusy] = useState(false);         // a flight is playing
  const busyRef = useRef(false); busyRef.current = busy;
  const [hint, setHint] = useState(false);
  const skipRef = useRef(null);
  const animatedRes = useRef(s.res.length);        // reveals already on screen
  const typedFrom = useRef({ leg: s.leg, tips: s.tips }); // tips shown before this mount do not type
  const legIntroFor = useRef(-1);
  const n = P.legs.length;
  const L = P.legs[Math.min(s.leg, n - 1)];
  const sRef = useRef(s); sRef.current = s;
  // The globe takes what the column leaves, so the buttons below it stay on
  // screen (owner, 2026-11-06: the next-leg button must never fall off).
  const rootRef = useRef(null);
  const regionRef = useRef(null);
  const overRef = useRef(null);
  const cardMax = useRef(0);
  const [openTip, setOpenTip] = useState(-1);
  const deskWide = useDesk();
  const desk = deskWide && onStage;
  // FULL SCREEN ON THE STAGE (owner, 2026-11-09: "make the Carmen globe full
  // screen ... with a faint clue and pin button overlay at the top and bottom",
  // then "the same on desktop too"). On the stage, at every width, the globe is
  // the page's back layer and everything else floats over it. Replaces the
  // desktop Dossier column. Off the stage (the board on the ending) is unchanged.
  const fs = !!onStage;
  // BARE BY DEFAULT (owner, 2026-11-09: "globe even more prominent and the
  // extra stuff besides clues and pin hidden"). Only the clue card and the pin
  // button show; the top bar, leg strip, zoom, hint and the Clock / How to play
  // / Give up row sit behind one small menu button (Give up stays reachable).
  const [chrome, setChrome] = useState(false);

  // The world loads once; the globe mounts on it.
  useEffect(() => {
    let alive = true;
    loadWorld().then((world) => {
      if (!alive || !svgRef.current) return;
      globe.current = new CarmenGlobe(svgRef.current, world, {
        onTap: (ll) => setS((st) => (st.phase === 'play' ? { ...st, guess: [Math.round(ll[0] * 100) / 100, Math.round(ll[1] * 100) / 100] } : st)),
      });
      setReady(true);
    }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; if (globe.current) globe.current.destroy(); globe.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Where the globe sits: as big as the region's width allows (the region
  // fills the column's height), its foot on the region's foot, and its top
  // tucked under the clue card by up to half the card.
  useEffect(() => {
    if (!ready) return undefined;
    const place = () => {
      const R = regionRef.current, O = overRef.current, G = globe.current;
      if (!R || !G) return;
      const w = R.clientWidth, h = R.clientHeight;
      if (fs) {
        // Full screen: a big globe, a touch below centre, free to run under the
        // clue card and the buttons (they are glass) and past the phone's sides.
        const r = Math.max(120, Math.min(w * 0.82, h * 0.46));
        G.setFrame(w, h, w / 2, h * (w < 700 ? 0.6 : 0.55), r);
        return;
      }
      // The largest card this visit sized it, so the globe holds still as tips arrive.
      const ch = Math.max(O ? O.offsetHeight : 0, cardMax.current);
      cardMax.current = ch;
      const tuck = Math.min(ch * 0.5, 120);
      const foot = 30; // room for the hint line under the globe
      let r = Math.min(w / 2 - 6, (h - ch + tuck - foot) / 2);
      r = Math.max(r, Math.min(w / 2 - 6, (h - foot) / 2) * 0.55);
      G.setFrame(w, h, w / 2, h - r - foot, r);
    };
    place();
    let ro = null;
    try { ro = new ResizeObserver(place); if (regionRef.current) ro.observe(regionRef.current); if (overRef.current) ro.observe(overRef.current); } catch (e) {}
    window.addEventListener('resize', place);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', place); };
  }, [ready, fs]);

  // ENTER ON THE DESK (owner, 2026-10-29: desktop puzzles take the physical
  // keyboard): Enter locks in the pin, then moves on to the next leg.
  useEffect(() => {
    if (!desk || !active || done) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Enter' || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const a = document.activeElement;
      if (a && /^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      if (skipRef.current) return;
      const st = sRef.current;
      if (st.phase === 'play' && st.guess) { e.preventDefault(); lockIn(P, setS); }
      else if (st.phase === 'reveal' && !busyRef.current) { e.preventDefault(); nextLeg(P, setS); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [desk, active, done, P, setS]);

  // What the globe shows, rebuilt from the state.
  const sync = useCallback((opts = {}) => {
    const G = globe.current; if (!G) return;
    const st = sRef.current;
    const visited = [P.start.ll, ...st.res.map((r, i) => P.legs[i].ll)];
    const showLast = st.phase === 'reveal' || done;
    const cities = showLast ? visited : visited.slice(0, st.res.length + 1);
    G.setCities(opts.hideLastCity ? cities.slice(0, -1) : cities);
    const pairs = [];
    const upto = opts.trailUpto != null ? opts.trailUpto : st.res.length;
    for (let i = 0; i < upto; i++) pairs.push([i === 0 ? P.start.ll : P.legs[i - 1].ll, P.legs[i].ll]);
    G.setTrail(pairs);
  }, [P, done]);

  // Start of play: the case file, then the first leg card.
  useEffect(() => {
    if (!ready) return;
    const G = globe.current;
    G.setInteractive(active && s.phase === 'play' && !busy && !curtain);
  }, [ready, active, s.phase, busy, curtain]);

  // Idle spin before Start.
  useEffect(() => {
    if (!ready) return;
    const G = globe.current;
    if (!active && !done) { G.view([P.start.ll[0] - 40, 25], 1); sync(); G.setIdle(true); }
    else G.setIdle(false);
  }, [ready, active, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const showCurtain = useCallback((kind, ms) => new Promise((res) => {
    let fin = false;
    const end = () => { if (fin) return; fin = true; skipRef.current = null; setCurtain(null); res(); };
    skipRef.current = end;
    setCurtain(kind);
    if (ms) setTimeout(end, ms);
  }), []);

  // A new leg: the case file first (leg 1 only, on a fresh start), then the
  // leg card, then the globe swings to where she was last seen.
  useEffect(() => {
    if (!ready || !active || done || s.phase !== 'play' || legIntroFor.current === s.leg) return;
    legIntroFor.current = s.leg;
    setOpenTip(-1);
    const G = globe.current;
    (async () => {
      sync();
      if (s.leg === 0 && s.res.length === 0 && s.tips === 1 && !s.guess) await showCurtain('file', 3400);
      await showCurtain('leg', 1700);
      const from = lastSeen(P, s.leg).ll;
      await G.lookAt(from, 1, 800);
      G.ring(from, '#c4e08a', 60, 1000, 3);
      if (sRef.current.guess) G.setGuess(sRef.current.guess, false);
      setHint(true);
    })();
  }, [ready, active, done, s.phase, s.leg]); // eslint-disable-line react-hooks/exhaustive-deps

  // The pin follows the state.
  useEffect(() => {
    if (!ready || s.phase !== 'play') return;
    globe.current.setGuess(s.guess, true);
    if (s.guess) setHint(false);
  }, [ready, s.guess, s.phase]);

  // A reveal: fly the route, burst the rings, draw the miss line. A reveal
  // restored from a save is drawn still.
  useEffect(() => {
    if (!ready || s.phase !== 'reveal') return;
    const G = globe.current;
    const i = s.res.length - 1, r = s.res[i], to = P.legs[i].ll, from = lastSeen(P, i).ll;
    const fresh = animatedRes.current < s.res.length;
    animatedRes.current = s.res.length;
    if (!fresh) {
      sync(); G.setGuess(r.g, false); G.setTruth(to); G.setMiss(r.g, to, false);
      const sep = kmBetween(r.g, to) / 6371;
      G.view([(r.g[0] + to[0]) / 2, (r.g[1] + to[1]) / 2], Math.max(1, Math.min(3.2, 1.5 / (sep + 0.25))));
      return;
    }
    setBusy(true); setHint(false);
    (async () => {
      sync({ trailUpto: i, hideLastCity: true });
      G.setGuess(r.g, false); G.setTruth(null); G.setMiss(null);
      await G.fly(from, to);
      G.setCities([P.start.ll, ...P.legs.slice(0, i + 1).map((x) => x.ll)]);
      G.setTruth(to);
      G.ring(to, '#c4e08a', 90, 1100, 4); G.ring(to, '#ffffff', 60, 900, 2, 180);
      await sleep(350);
      G.setMiss(r.g, to, true);
      const sep = kmBetween(r.g, to) / 6371;
      const mid = [(r.g[0] + to[0]) / 2, (r.g[1] + to[1]) / 2];
      await G.lookAt(Math.abs(r.g[0] - to[0]) > 180 ? to : mid, Math.max(1, Math.min(3.2, 1.5 / (sep + 0.25))), 700);
      setBusy(false);
    })();
  }, [ready, s.phase, s.res.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // The ending: the finale, then the light show, then the shell's ending.
  const endedFor = useRef(false);
  useEffect(() => {
    if (!done || !held || endedFor.current) return;
    endedFor.current = true;
    (async () => {
      await showCurtain('finale', 2600);
      await showCurtain('show', 0);
      if (release) release();
    })();
  }, [done, held]); // eslint-disable-line react-hooks/exhaustive-deps

  // A finished board, seen again from the ending: the whole route, still.
  useEffect(() => {
    if (!ready || !done || held) return;
    const G = globe.current;
    G.setIdle(false); G.setGuess(null); G.setTruth(null); G.setMiss(null);
    sync({ trailUpto: s.res.length });
    G.setCities([P.start.ll, ...P.legs.slice(0, s.res.length).map((x) => x.ll)]);
    G.view([60, 25], 1);
  }, [ready, done, held]); // eslint-disable-line react-hooks/exhaustive-deps

  const res = s.phase === 'reveal' ? s.res[s.res.length - 1] : null;
  const total = s.res.reduce((a, r) => a + r.pts, 0);
  const tipsShown = done ? 3 : s.tips;
  const legShown = s.phase === 'reveal' ? s.res.length - 1 : Math.min(s.leg, n - 1);
  const LL = P.legs[legShown];

  const cardEl = (!done || !onStage) ? (
    <div className="cmn-card">
      <div className="cmn-eb">{legShown === n - 1 ? 'Final leg' : `Leg ${legShown + 1} of ${n}`} · Last seen: <span>{lastSeen(P, legShown).name}</span></div>
      {s.phase === 'reveal' && onStage && !done && !desk ? null : (
        <ul className="cmn-tips">
          {LL.tips.slice(0, done ? 3 : tipsShown).map((t, k, arr) => {
            const typed = !(legShown < typedFrom.current.leg || (legShown === typedFrom.current.leg && k < typedFrom.current.tips));
            const old = onStage && !done && !desk && k < arr.length - 1 && openTip !== k;
            return (
              <li key={`${legShown}-${k}`} className={old ? 'old' : ''} onClick={old ? () => setOpenTip(k) : undefined}>
                <span className={'cmn-tag t' + k}>{TIP_TAGS[k]}</span><TypedTip text={t} animate={typed && !done} />
              </li>
            );
          })}
        </ul>
      )}
      {/* THE NEXT TIP SITS WITH THE TIPS (owner, 2026-11-08), so it is always on screen. */}
      {active && !done && s.phase === 'play' && s.tips < 3 ? (
        <button type="button" className="cmn-more" onClick={() => setS((st) => (st.tips < 3 && st.phase === 'play' ? { ...st, tips: st.tips + 1 } : st))}>
          + {TIP_TAGS[s.tips]} tip <small>&#8722;150 points</small>
        </button>
      ) : null}
    </div>
  ) : null;
  const resEl = res ? (
    <div className="cmn-res" key={'r' + s.res.length}>
      <div className="big">+{fmt(res.pts)}</div>
      <div className="sub"><b>{LL.name}</b><br />{fmt(res.km)} km away{res.tips > 1 ? ` · ${res.tips} tips` : ''}</div>
      <div className="grade">{grade(res.km)}</div>
    </div>
  ) : null;
  const doneNote = done && !held && onStage ? (
    <div className="cmn-donenote">{s.res.length === n ? `Case closed: ${fmt(total)} points` : `${fmt(total)} points before the trail went cold`}</div>
  ) : null;
  const zoomEl = active && !done ? (
    <div className="cmn-zoom">
      <button type="button" aria-label="Zoom in" onClick={() => globe.current && globe.current.zoomBy(1.6)}>+</button>
      <button type="button" aria-label="Zoom out" onClick={() => globe.current && globe.current.zoomBy(1 / 1.6)}>&#8722;</button>
    </div>
  ) : null;
  const hintEl = (
    <div className="cmn-hint" style={{ opacity: (hint && active && !done && s.phase === 'play' && !s.guess) || busy ? 1 : 0 }}>
      {busy ? 'Tracking her flight' : desk ? 'Drag to spin · scroll to zoom · click to drop your pin' : 'Drag to spin · tap to drop your pin'}
    </div>
  );
  const stripEl = (
    <div className="cmn-strip" key="strip">
      <div className="cmn-legs">{P.legs.map((_, i) => <i key={i} className={(i < s.res.length ? 'd' : '') + (i === s.leg && !done && s.phase === 'play' ? ' c' : '')}>{i + 1}</i>)}</div>
      <div className="cmn-pts"><b>{fmt(total)}</b> points</div>
    </div>
  );
  const svgEl = <svg ref={svgRef} className="cmn-svg" aria-label={desk ? 'Globe. Drag to spin, scroll to zoom, click to drop your pin.' : 'Globe. Drag to spin, tap to drop your pin.'} role="img" />;
  const failEl = failed ? <div className="cmn-fail">The globe did not load. Check your connection and reload.</div> : null;

  return (
    <div className={'cmn' + (onStage ? '' : ' off') + (fs ? ' fs' : '') + (fs && !chrome ? ' bare' : '')} ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {fs ? (
        <>
          {/* The globe fills the screen behind everything (z -1 in the stage). */}
          <div className="cmn-region" ref={regionRef} key="region">{svgEl}{failEl}</div>
          {stripEl}
          <div className="cmn-fscard">
            {active && !done ? (
              <button type="button" className="cmn-menu" aria-label={chrome ? 'Hide menu' : 'Show menu: home, clock, how to play, give up'} aria-expanded={chrome} onClick={() => setChrome((c) => !c)}>
                {chrome ? <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  : <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="3" cy="8" r="1.6" fill="currentColor" /><circle cx="8" cy="8" r="1.6" fill="currentColor" /><circle cx="13" cy="8" r="1.6" fill="currentColor" /></svg>}
              </button>
            ) : null}
            {cardEl}{resEl}
          </div>
          <div className="cmn-fsgap" />
          <div className="cmn-fsfoot">{hintEl}{zoomEl}</div>
          {doneNote}
        </>
      ) : (
        <>
          {stripEl}
          {/* THE GLOBE RESTS UNDER THE CLUES (owner, 2026-11-08). Off the stage
              the clue card floats over the globe's top. */}
          <div className="cmn-region" ref={regionRef} key="region">
            {svgEl}{failEl}
            <div className="cmn-over" ref={overRef}>{cardEl}{resEl}</div>
            {zoomEl}
            {hintEl}
          </div>
          {doneNote}
        </>
      )}

      <Curtain show={curtain === 'file'} onSkip={() => skipRef.current && skipRef.current()}><CaseFile P={P} /></Curtain>
      <Curtain show={curtain === 'leg'} onSkip={() => skipRef.current && skipRef.current()}><LegCard P={P} leg={s.leg} /></Curtain>
      <Curtain show={curtain === 'finale'} onSkip={() => skipRef.current && skipRef.current()}><Finale P={P} s={s} gaveUp={gaveUp} /></Curtain>
      {curtain === 'show' ? (
        <Portal>
          <div className="cmn-end" onClick={() => skipRef.current && skipRef.current()}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="cmn-end-in"><CaseShow P={P} s={s} gaveUp={gaveUp} onDone={() => skipRef.current && skipRef.current()} /></div>
            <div className="cmn-skip dk">Tap to skip</div>
          </div>
        </Portal>
      ) : null}
    </div>
  );
}

// The buttons under the globe (PlayStage `bottom`), floating over the
// full-screen globe on the stage at every width.
export function CarmenTools({ P, s, setS, active, inSide = false }) {
  const desk = useDesk();
  if (!active) return null;
  const n = P.legs.length;
  if (s.phase === 'play') {
    const label = s.guess ? (desk ? 'Lock in pin · Enter' : 'Lock in pin') : (desk ? 'Click the globe to drop a pin' : 'Tap the globe to drop a pin');
    return (
      <div className="cmn-tools">
        <button type="button" className="cmn-btn pri" disabled={!s.guess} onClick={() => lockIn(P, setS)}>{label}</button>
      </div>
    );
  }
  const last = s.res.length >= n;
  return (
    <div className="cmn-tools">
      <button type="button" className="cmn-btn pri wide" onClick={() => nextLeg(P, setS)}>{(last ? 'See how it ended' : 'Next leg') + (desk ? ' · Enter' : '')}</button>
    </div>
  );
}

const CSS = `
.cmn{display:flex;flex-direction:column;gap:10px;width:100%;max-width:560px;margin:0 auto;flex:1 1 auto;min-height:0;font-family:'Manrope',system-ui,sans-serif;color:var(--pst-ink,#16181d);}
.cmn-strip{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;border:1px solid var(--pst-ink,#16181d);border-radius:14px;}
.cmn-legs{display:flex;gap:6px;}
.cmn-legs i{font-style:normal;width:26px;height:26px;border-radius:50%;border:1px solid var(--pst-ink,#16181d);display:grid;place-items:center;font-size:11px;font-weight:800;transition:background .3s,transform .3s;}
.cmn-legs i.d{background:var(--pst-acc,#c4e08a);color:#16181d;}
.cmn-legs i.c{background:var(--pst-ink,#16181d);color:var(--pst-bg,#fff);transform:scale(1.1);}
.cmn-pts{font-size:13px;font-weight:600;color:var(--pst-mute,#4a4f58);}
.cmn-pts b{font-size:15px;font-weight:800;color:var(--pst-ink,#16181d);font-variant-numeric:tabular-nums;}
.cmn-card{border:1px solid var(--pst-ink,#16181d);border-radius:14px;padding:10px 12px;background:color-mix(in srgb, var(--pst-bg,#fff) 90%, transparent);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
.cmn-region{position:relative;flex:1 1 auto;min-height:340px;width:100%;}
.pst.inl .cmn-region{flex:none;height:min(76vh,720px);}
.cmn.off .cmn-region{flex:none;height:min(110vw,560px);}
.cmn-svg{position:absolute;inset:0;width:100%;height:100%;display:block;-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 26px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 26px),transparent);touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab;}
.cmn-surf{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 26px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 26px),transparent);}
.cmn.fs .cmn-surf{-webkit-mask-image:none;mask-image:none;}
.cmn-over{position:absolute;left:0;right:0;top:0;z-index:2;display:flex;flex-direction:column;gap:8px;pointer-events:none;}
.cmn-over>*{pointer-events:auto;}
.cmn-eb{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--pst-mute,#8a909a);}
.cmn-eb span{color:var(--pst-acc-ink,#3f5a12);text-transform:none;letter-spacing:0;font-size:12.5px;}
.cmn-seen{font-size:14px;font-weight:700;margin-top:2px;}
.cmn-seen span{color:var(--pst-acc-ink,#3f5a12);}
.cmn-tips{list-style:none;margin:9px 0 0;padding:0;display:flex;flex-direction:column;gap:8px;}
.cmn-tips li{font-size:14px;line-height:1.42;font-weight:500;animation:cmnIn .4s ease both;}
.cmn-tips li.old{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer;opacity:.8;}
.cmn-tag{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;padding:2px 8px;border-radius:999px;margin-right:6px;vertical-align:1px;background:#d9edae;color:#16181d;}
.cmn-tag.t1{background:#e8eaf0;}
.cmn-tag.t2{background:#16181d;color:#d9edae;}
@keyframes cmnIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.cmn-res{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;background:#16181d;color:#d9edae;box-shadow:0 6px 18px rgba(22,24,29,.22);animation:cmnIn .4s ease both;}
.cmn-res .big{font-size:24px;font-weight:800;font-variant-numeric:tabular-nums;min-width:72px;}
.cmn-res .sub{font-size:13px;font-weight:600;color:rgba(255,255,255,.75);line-height:1.3;flex:1;}
.cmn-res .sub b{color:#d9edae;}
.cmn-res .grade{border:2.5px solid currentColor;border-radius:8px;padding:3px 8px;font-weight:800;font-size:12px;letter-spacing:.08em;text-transform:uppercase;transform:rotate(-7deg);animation:cmnStamp .4s .9s cubic-bezier(.2,1.6,.4,1) both;white-space:nowrap;}
@keyframes cmnStamp{from{transform:scale(2.6) rotate(-7deg);opacity:0}to{transform:scale(1) rotate(-7deg);opacity:1}}
.cmn-zoom{position:absolute;right:2px;bottom:44px;z-index:3;display:flex;flex-direction:column;gap:6px;}
.cmn-zoom button{width:34px;height:34px;border-radius:50%;border:1px solid var(--pst-ink,#16181d);background:var(--pst-bg,#fff);color:var(--pst-ink,#16181d);font:800 18px 'Manrope',system-ui,sans-serif;cursor:pointer;}
.cmn-hint{z-index:3;position:absolute;left:50%;bottom:4px;transform:translateX(-50%);font-size:12px;font-weight:700;color:#16181d;background:rgba(255,255,255,.94);padding:5px 11px;border-radius:999px;pointer-events:none;white-space:nowrap;transition:opacity .3s;}
.cmn-fail{position:absolute;inset:0;display:grid;place-items:center;text-align:center;font-size:14px;font-weight:700;padding:20px;}
.cmn-more{display:block;width:100%;margin:10px 0 0;min-height:40px;border-radius:10px;border:1px solid var(--pst-ink,#16181d);background:var(--pst-bg,#fff);color:var(--pst-ink,#16181d);font-family:'Manrope',system-ui,sans-serif;font-size:14px !important;font-weight:800 !important;cursor:pointer;}
.cmn-more small{font-weight:600;opacity:.65;}
@media (max-height:700px){.cmn-strip{padding:5px 10px;}.cmn-legs i{width:22px;height:22px;}.cmn-card{padding:9px 11px;}.cmn-tips li{font-size:13.5px;line-height:1.36;}.cmn-tips{gap:6px;margin-top:6px;}}
.cmn-donenote{text-align:center;font-size:14px;font-weight:700;}
.cmn-tools{display:flex;gap:8px;width:100%;max-width:560px;margin:0 auto;}
.cmn-btn{flex:1;min-height:48px;border-radius:12px;border:1px solid var(--pst-ink,#16181d);background:var(--pst-bg,#fff);color:var(--pst-ink,#16181d);font-family:'Manrope',system-ui,sans-serif;font-size:15px !important;font-weight:800 !important;cursor:pointer;}
.cmn-btn.pri{background:var(--pst-ink,#16181d);color:var(--pst-bg,#fff);}
.cmn-btn:disabled{opacity:.35;cursor:default;}
.cmn-btn small{font-weight:600;opacity:.65;}
.cmn-cur{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.97);animation:cmnFade .25s ease both;cursor:pointer;color:#16181d;}
@keyframes cmnFade{from{opacity:0}to{opacity:1}}
.cmn-skip{position:absolute;bottom:22px;left:0;right:0;text-align:center;font-size:12px;font-weight:600;color:#8a909a;}
.cmn-skip.dk{color:rgba(255,255,255,.55);}
.cmn-file{width:min(88vw,400px);border:1px solid #16181d;border-radius:4px 16px 16px 16px;background:#eef6dc;padding:22px 20px 20px;position:relative;margin-top:28px;animation:cmnFile .5s cubic-bezier(.2,1.2,.4,1) both;}
.cmn-tab{position:absolute;top:-28px;left:-1px;height:28px;padding:0 14px;display:flex;align-items:center;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;background:#eef6dc;border:1px solid #16181d;border-bottom:none;border-radius:10px 10px 0 0;}
@keyframes cmnFile{from{transform:translateY(40px) rotate(3deg);opacity:0}to{transform:none;opacity:1}}
.cmn-ln{font-size:15px;font-weight:600;padding:9px 0;border-bottom:1px solid rgba(22,24,29,.14);min-height:40px;}
.cmn-ln:last-of-type{border-bottom:none;}
.cmn-ln b{display:inline-block;width:92px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8a909a;}
.cmn-bigstamp{position:absolute;right:16px;bottom:16px;border:3px solid #16181d;border-radius:10px;padding:5px 12px;font-weight:800;font-size:22px;letter-spacing:.1em;transform:rotate(-10deg);animation:cmnStamp2 .45s cubic-bezier(.2,1.6,.4,1) both;}
@keyframes cmnStamp2{from{transform:scale(3) rotate(-10deg);opacity:0}to{transform:scale(1) rotate(-10deg);opacity:1}}
.cmn-legcard{text-align:center;padding:0 16px;animation:cmnFile .45s cubic-bezier(.2,1.2,.4,1) both;}
.cmn-n{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#8a909a;}
.cmn-big{font-size:clamp(42px,13vw,60px);font-weight:800;letter-spacing:-.03em;line-height:1.05;margin:4px 0 8px;}
.cmn-from{font-size:16px;font-weight:600;color:#4a4f58;}
.cmn-from b{color:#16181d;}
.cmn-q{margin-top:16px;display:inline-block;font-size:14px;font-weight:700;padding:8px 14px;border-radius:999px;background:#d9edae;animation:cmnIn .4s .45s both;}
.cmn-dots{display:flex;gap:8px;justify-content:center;margin-top:20px;}
.cmn-dots i{width:12px;height:12px;border-radius:50%;border:1.5px solid #16181d;background:#fff;}
.cmn-dots i.d{background:#c4e08a;}
.cmn-dots i.c{background:#16181d;animation:cmnBeat 1s ease-in-out infinite;}
@keyframes cmnBeat{50%{transform:scale(1.35)}}
.cmn-catch{text-align:center;}
.cmn-word{font-size:clamp(48px,15vw,64px);font-weight:800;letter-spacing:-.03em;animation:cmnStamp3 .55s cubic-bezier(.2,1.6,.4,1) both;}
.cmn-word.sm{font-size:clamp(38px,12vw,50px);}
@keyframes cmnStamp3{from{transform:scale(2.8);opacity:0}to{transform:scale(1);opacity:1}}
.cmn-where{font-size:17px;font-weight:700;color:#4a4f58;margin-top:6px;animation:cmnIn .4s .5s both;}
.cmn-rings{position:relative;width:200px;height:200px;margin:0 auto 10px;}
.cmn-rings i{position:absolute;inset:0;border-radius:50%;border:2px solid #16181d;animation:cmnClose 1.2s cubic-bezier(.5,0,.3,1) both;}
.cmn-rings i:nth-child(2){animation-delay:.15s;border-color:#3f5a12;}
.cmn-rings i:nth-child(3){animation-delay:.3s;}
@keyframes cmnClose{from{transform:scale(1.6);opacity:0}60%{opacity:1}to{transform:scale(.18);opacity:0}}
.cmn-rings b{position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px;border-radius:50%;background:#c4e08a;border:2px solid #16181d;animation:cmnPop .4s 1.1s cubic-bezier(.2,1.6,.4,1) both;}
@keyframes cmnPop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
.cmn-escape{width:260px;height:120px;margin:0 auto 10px;position:relative;overflow:hidden;}
.cmn-escape svg{position:absolute;left:0;top:0;animation:cmnFly 1.6s cubic-bezier(.5,0,.6,1) both;}
@keyframes cmnFly{from{transform:translate(0,80px)}to{transform:translate(300px,-60px)}}
.cmn-end{position:fixed;inset:0;z-index:2147483000;overflow:auto;background:radial-gradient(130% 70% at 50% 0%,#2e3a1c 0%,#1b2014 45%,#121410 100%);color:#fff;cursor:pointer;animation:cmnFill .55s ease both;}
@keyframes cmnFill{from{clip-path:circle(0% at 50% 55%)}to{clip-path:circle(150% at 50% 55%)}}
.cmn-end-in{max-width:520px;margin:0 auto;padding:28px 16px 70px;}
.cmn-closed{display:flex;justify-content:center;}
.cmn-closed span{border:3px solid #c4e08a;color:#c4e08a;border-radius:10px;padding:4px 12px;font-weight:800;font-size:15px;letter-spacing:.12em;transform:rotate(-6deg);animation:cmnStamp4 .45s .2s cubic-bezier(.2,1.6,.4,1) both;}
@keyframes cmnStamp4{from{transform:scale(3) rotate(-6deg);opacity:0}to{transform:scale(1) rotate(-6deg);opacity:1}}
.cmn-verdict{text-align:center;margin:14px 0 2px;font-size:clamp(36px,11vw,44px);font-weight:800;letter-spacing:-.02em;animation:cmnPop .6s .5s cubic-bezier(.2,1.4,.4,1) both;}
.cmn-recap{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:8px 12px;margin:14px 0 10px;}
.cmn-bar{display:grid;grid-template-columns:96px 1fr 46px;gap:10px;align-items:center;padding:7px 0;font-size:13.5px;font-weight:700;opacity:0;transition:opacity .25s;}
.cmn-bar.on{opacity:1;}
.cmn-bar .c{display:block;}
.cmn-bar .c small{display:block;font-size:11px;font-weight:600;color:rgba(255,255,255,.7);}
.cmn-bar .tr{display:block;height:12px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;}
.cmn-bar .fl{display:block;height:100%;width:0;background:#c4e08a;border-radius:6px;transition:width .55s cubic-bezier(.3,.8,.3,1);}
.cmn-bar .v{text-align:right;font-variant-numeric:tabular-nums;}
.cmn-total{text-align:center;font-size:15px;font-weight:700;color:rgba(255,255,255,.7);opacity:0;transition:opacity .3s;}
.cmn-total.on{opacity:1;}
.cmn-total b{display:block;font-size:40px;color:#fff;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.1;}
.cmn-ladder{margin:16px 0 6px;display:flex;flex-direction:column-reverse;gap:5px;opacity:0;transition:opacity .3s;}
.cmn-ladder.on{opacity:1;}
.cmn-rung{height:38px;border-radius:10px;border:1px solid rgba(255,255,255,.22);display:flex;align-items:center;justify-content:space-between;padding:0 14px;font-weight:800;font-size:14px;color:rgba(255,255,255,.6);transition:all .25s;}
.cmn-rung small{font-weight:600;font-size:12px;}
.cmn-rung.lit{background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.6);}
.cmn-rung.fin{background:#c4e08a;color:#16181d;border-color:#c4e08a;transform:scale(1.03);box-shadow:0 8px 22px rgba(0,0,0,.25);}
.cmn-title{text-align:center;font-size:17px;font-weight:800;margin:10px 0 4px;opacity:0;transition:opacity .4s;}
.cmn-title.on{opacity:1;}
@media (prefers-reduced-motion:reduce){.cmn *{animation:none !important;transition:none !important;}}

/* FULL SCREEN ON THE STAGE (owner, 2026-11-09, phone and desktop). The globe
   region is the stage's back layer: fixed to the viewport in the full-screen
   stage, filling the stage box when the stage sits inline under the site
   header. The column above it lets taps through to the globe except on the
   glass pieces: the strip and clue card at the top, the zoom, the pin button
   and the foot row at the bottom. */
.cmn.fs{max-width:none;gap:8px;}
.cmn.fs .cmn-region{position:fixed;inset:0;z-index:-1;min-height:0;height:auto;flex:none;width:auto;pointer-events:auto;}
.pst.inl .cmn.fs .cmn-region{position:absolute;inset:0;height:auto;flex:none;}
.pst.inl:has(.cmn.fs){isolation:isolate;overflow:hidden;}
.cmn.fs .cmn-svg{-webkit-mask-image:none;mask-image:none;}
.pst:has(.cmn.fs){overflow:hidden;}
.pst:has(.cmn.fs) .pst-col{pointer-events:none;height:100%;}
.pst.inl:has(.cmn.fs) .pst-col{height:auto;}
.pst:has(.cmn.fs) .pst-col>*:not(.pst-top){pointer-events:auto;}
.pst:has(.cmn.fs) .pst-top{animation:none;justify-content:flex-start;flex:1 1 auto;min-height:0;}
.pst:has(.cmn.fs) .pst-eb,.pst:has(.cmn.fs) .pst-foot{display:none;}
.cmn.fs .cmn-strip,.cmn.fs .cmn-fscard,.cmn.fs .cmn-zoom,.cmn.fs .cmn-donenote{pointer-events:auto;}
.cmn.fs>.cmn-strip,.cmn.fs .cmn-fscard{width:100%;max-width:640px;margin:0 auto;}
.cmn-fscard{display:flex;flex-direction:column;gap:8px;}
.cmn.fs .cmn-strip,.cmn.fs .cmn-card{background:color-mix(in srgb, var(--pst-bg,#fff) 66%, transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
.cmn.fs .cmn-card{max-height:42dvh;overflow-y:auto;}
.cmn.fs .cmn-more{background:color-mix(in srgb, var(--pst-bg,#fff) 55%, transparent);}
.cmn-fsgap{flex:1 1 auto;min-height:0;}
.cmn-fsfoot{position:relative;display:flex;justify-content:flex-end;align-items:flex-end;min-height:40px;flex:none;}
.cmn.fs .cmn-zoom{position:static;}
.cmn.fs .cmn-zoom button{background:color-mix(in srgb, var(--pst-bg,#fff) 70%, transparent);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
.cmn.fs .cmn-hint{bottom:6px;background:color-mix(in srgb, var(--pst-bg,#fff) 80%, transparent);color:var(--pst-ink,#16181d);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
.cmn.fs .cmn-donenote{padding:8px 12px;border-radius:12px;background:color-mix(in srgb, var(--pst-bg,#fff) 70%, transparent);}
.pst:has(.cmn.fs) .cmn-btn:disabled{opacity:1;background:color-mix(in srgb, var(--pst-bg,#fff) 66%, transparent);color:var(--pst-ink,#16181d);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
.pst:has(.cmn.fs) .sft-b:not(.on),.pst:has(.cmn.fs) .stb-home,.pst:has(.cmn.fs) .stb-look,.pst:has(.cmn.fs) .stb-share,.pst:has(.cmn.fs) .stb-nav{background:color-mix(in srgb, var(--pst-bg,#fff) 70%, transparent);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
/* Bare: everything but the clues and the pin button steps aside. */
.pst:has(.cmn.bare) .stb,.pst:has(.cmn.bare) .sft,.cmn.bare>.cmn-strip,.cmn.bare .cmn-zoom,.cmn.bare .cmn-hint{display:none !important;}
.cmn-fscard{position:relative;}
.cmn-menu{position:absolute;top:8px;right:8px;z-index:2;width:32px;height:32px;border-radius:50%;border:1px solid var(--pst-ink,#16181d);background:color-mix(in srgb, var(--pst-bg,#fff) 70%, transparent);color:var(--pst-ink,#16181d);display:grid;place-items:center;padding:0;cursor:pointer;}
.cmn.fs .cmn-card .cmn-eb{padding-right:36px;}
.cmn.fs .cmn-card{background:color-mix(in srgb, var(--pst-bg,#fff) 84%, transparent);}
@media (min-width:1000px){.cmn.fs .cmn-card{padding:14px 16px;}.cmn.fs .cmn-tips{gap:10px;}.cmn.fs .cmn-tips li{font-size:15.5px;line-height:1.5;}.cmn.fs .cmn-zoom button{width:40px;height:40px;}.pst:has(.cmn.fs) .cmn-btn{min-height:54px;font-size:16px !important;}}
`;
