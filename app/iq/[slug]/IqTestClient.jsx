'use client';

// One /iq test: the intro, the adaptive run, and the result.
//
// THE RESULT CARD FILLS THE SCREEN ON PURPOSE (owner, 2026-09-29). It is the
// thing people screenshot, so it carries the ring, the reading, the category
// and the site's name and nothing else, and it is sized to the viewport so a
// screenshot of it is exactly it. Everything that is an action rather than a
// result, the share control, the retake, the next daily puzzle and the other
// tests, sits BELOW the fold where a screenshot does not reach.
//
// Nothing is posted anywhere (owner: standalone, no board). The reading is kept
// on this device only, so the hub can show a reader their own best.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import CircuitFrame from '../../circuits/CircuitFrame';
import { RAMP_ORDER } from '@/lib/category-ramp';
import { MIN_ITEMS, MAX_ITEMS, TARGET_SE, SECONDS_PER_ITEM, IQ_TESTS } from '@/lib/iq-tests';
import { estimate, nextItem, reading, ordinalPct } from '../IqEngine';
import { glyphFor, GLYPH_BOX } from '@/lib/game-glyphs';
import { IQ_RAMP_CSS } from '@/lib/iq-style';
import { liveDailyKeys, DAILY_GAME_MAP } from '@/lib/daily-games';
import { dailyRunHref, playedToday } from '@/lib/daily-run';

const STORE = 'sot_iq_results';

export function readIqResults() {
  try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { return {}; }
}

function saveResult(slug, r) {
  try {
    const all = readIqResults();
    const prev = all[slug] || {};
    const best = prev.best && prev.best.iq >= r.iq ? prev.best : r;
    all[slug] = { last: r, best, runs: (prev.runs || 0) + 1 };
    localStorage.setItem(STORE, JSON.stringify(all));
  } catch (e) {}
}

// Which daily to offer after a test, most fitting first. The rest of the live
// roster follows in registry order, and the first one this reader has not
// played today is the one shown.
const NEXT_FOR = {
  general: ['streak', 'deep', 'dating', 'thread'],
  geography: ['atlas', 'flank', 'ping', 'span', 'niche'],
  history: ['deep', 'dating', 'streak'],
  science: ['deep', 'streak'],
  screen: ['thread', 'streak', 'deep'],
  music: ['streak', 'deep'],
  literature: ['deep', 'streak', 'crux'],
  sports: ['sport', 'streak'],
  business: ['biz', 'streak'],
};

// THE RUN handed over after a test (owner, 2026-09-29): up to three of today's
// unplayed dailies, the fitting ones first, carried game to game as ?run=.
// Played is read from each game's own day breadcrumb, so this costs no request
// and works for a guest. Also the day's progress and two alternates.
function useRunPlan(slug, active) {
  const [plan, setPlan] = useState(null);
  useEffect(() => {
    if (!active) return;
    const live = liveDailyKeys();
    const done = new Set(live.filter((k) => playedToday(k)));
    const pref = (NEXT_FOR[slug] || []).filter((k) => live.includes(k));
    const firstCat = pref[0] ? (DAILY_GAME_MAP[pref[0]] || {}).cat : null;
    const sameCat = live.filter((k) => !pref.includes(k) && (DAILY_GAME_MAP[k] || {}).cat === firstCat);
    const rest = live.filter((k) => !pref.includes(k) && !sameCat.includes(k));
    const open = [...pref, ...sameCat, ...rest].filter((k) => !done.has(k));
    setPlan({ run: open.slice(0, 3), swaps: open.slice(3, 5), played: done.size, total: live.length });
  }, [slug, active]);
  return plan;
}

// Which questions this browser has already been dealt on a test, so a retake
// draws fresh ones while the bank allows it.
const SEEN = (slug) => `sot_iq_seen_${slug}`;
function readSeen(slug) { try { return JSON.parse(localStorage.getItem(SEEN(slug)) || '[]'); } catch (e) { return []; } }
function writeSeen(slug, ids) { try { localStorage.setItem(SEEN(slug), JSON.stringify(ids.slice(-240))); } catch (e) {} }

const ease = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

// THE REVEAL (owner-approved mockup, 2026-09-29). About three seconds, once:
// one pip per answer spins round the ring and drains into it as the arc sweeps
// to the percentile and the IQ counts up, a pulse lands it (two at 130+), then
// the player-field bell draws in and a "You" pin drops. Nothing moves after
// three seconds, so a screenshot from then on is clean. Reduced motion jumps
// to the last frame.
function useReveal(on) {
  const [t, setT] = useState(on ? 0 : 99);
  useEffect(() => {
    if (!on) return undefined;
    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (reduce) { setT(99); return undefined; }
    setT(0);
    let raf; const t0 = performance.now();
    const f = (now) => { const s = (now - t0) / 1000; setT(s); if (s < 3.4) raf = requestAnimationFrame(f); else setT(99); };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  return t;
}

const BW = 300, BBASE = 78, BTOP = 12;
const bx = (iq) => ((iq - 55) / 90) * BW;
const by = (iq) => { const z = (iq - 100) / 15; return BBASE - (BBASE - BTOP) * Math.exp(-z * z / 2); };
const BELL = (() => { let d = ''; for (let v = 55; v <= 145; v += 1) d += (v === 55 ? 'M' : 'L') + bx(v).toFixed(1) + ' ' + by(v).toFixed(1); return d; })();
const AREA = 'M0 ' + BBASE + BELL.replace(/^M/, ' L') + ' L' + BW + ' ' + BBASE + ' Z';

export default function IqTestClient({ test, pool, model, bankSize, measured }) {
  const cat = RAMP_ORDER[test.ramp] || 'Trivia';
  const [phase, setPhase] = useState('intro'); // intro | play | done
  const [answers, setAnswers] = useState([]); // {id, b, right}
  const [item, setItem] = useState(null);
  const [picked, setPicked] = useState(null);
  const [left, setLeft] = useState(SECONDS_PER_ITEM);
  const [prior, setPrior] = useState(null);
  const [copied, setCopied] = useState(false);
  const usedRef = useRef(new Set());
  const lockRef = useRef(false);
  const cardRef = useRef(null);

  useEffect(() => { setPrior(readIqResults()[test.slug] || null); }, [test.slug]);

  // Every new screen and every new question starts at the top, AFTER it has
  // rendered: scrolling in the click handler runs against the old, taller
  // page and leaves a phone reader looking at the foot of the next one.
  useEffect(() => {
    try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (e) {}
  }, [phase, item && item.id]);

  const est = useMemo(() => estimate(model, answers), [model, answers]);
  const result = phase === 'done' ? reading(est) : null;
  const right = answers.filter((a) => a.right).length;
  const plan = useRunPlan(test.slug, phase === 'done');
  const tr = useReveal(phase === 'done');
  const [livePool, setLivePool] = useState(pool);
  const runRef = useRef(null);
  const [cd, setCd] = useState(8); // the run's countdown, seconds
  const [cdPaused, setCdPaused] = useState(false);
  const [runSeen, setRunSeen] = useState(false); // run card at least 60% on screen
  const [runPast, setRunPast] = useState(false); // run card scrolled above the viewport
  const runHref = plan && plan.run.length ? dailyRunHref(plan.run[0], plan.run) : null;

  useEffect(() => {
    const el = runRef.current;
    if (phase !== 'done' || !el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => {
      setRunSeen(e.intersectionRatio >= 0.6);
      setRunPast(!e.isIntersecting && e.boundingClientRect.top < 0);
    }, { threshold: [0, 0.6, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, [phase, plan]);

  // Ticks only while the run card is mostly on screen, so it never runs inside
  // a screenshot of the result; any touch on the card or Not now pauses it.
  useEffect(() => {
    if (phase !== 'done' || !runHref || cdPaused || !runSeen) return undefined;
    if (cd <= 0) { window.location.href = runHref; return undefined; }
    const id = setTimeout(() => setCd((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, runHref, cdPaused, runSeen, cd]);

  function start() {
    usedRef.current = new Set();
    lockRef.current = false;
    setAnswers([]);
    setPicked(null);
    setCd(8); setCdPaused(false);
    // A retake draws questions this browser has not been dealt yet, as long
    // as enough of the pool is left to keep the test adaptive.
    const seen = new Set(readSeen(test.slug));
    const fresh = pool.filter((it) => !seen.has(it.id));
    const deal = fresh.length >= 120 ? fresh : pool;
    setLivePool(deal);
    // Open a little above the typical player: a first question that is too
    // easy teaches the estimate nothing.
    const first = nextItem(model, deal, 0.3, usedRef.current, null);
    if (!first) return;
    usedRef.current.add(first.id);
    setItem(first);
    setLeft(SECONDS_PER_ITEM);
    setPhase('play');
  }

  function answer(choice) {
    if (lockRef.current || !item) return;
    lockRef.current = true;
    const ok = choice === item.correct;
    setPicked({ choice, ok });
    const nextAnswers = [...answers, { id: item.id, b: item.b, right: ok }];
    setTimeout(() => {
      const e = estimate(model, nextAnswers);
      const n = nextAnswers.length;
      const stop = n >= MAX_ITEMS || (n >= MIN_ITEMS && e.sd <= TARGET_SE);
      setAnswers(nextAnswers);
      setPicked(null);
      if (stop) {
        const r = reading(e);
        writeSeen(test.slug, [...readSeen(test.slug), ...nextAnswers.map((a) => a.id)]);
        saveResult(test.slug, { iq: r.iq, pm: r.pm, pct: Math.round(r.pct * 10) / 10, right: nextAnswers.filter((a) => a.right).length, n, at: Date.now() });
        setItem(null);
        setPhase('done');
        // Count a finished test, once per sitting, on the same view rail the
        // pages use (admin: TRACKED_PAGES 'iq-<slug>-finished').
        try {
          fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizId: `iq-${test.slug}-finished` }) }).catch(() => {});
        } catch (err) {}
        return;
      }
      const nx = nextItem(model, livePool, e.mean, usedRef.current, item.lane);
      if (!nx) {
        setItem(null);
        setPhase('done');
        return;
      }
      usedRef.current.add(nx.id);
      setItem(nx);
      setLeft(SECONDS_PER_ITEM);
      lockRef.current = false;
    }, ok ? 650 : 1100);
  }

  // The clock. A question left to run out is a miss, which is how the
  // difficulties were measured: every gauntlet runs this same twenty seconds.
  useEffect(() => {
    if (phase !== 'play' || !item || picked) return undefined;
    if (left <= 0) { answer(-1); return undefined; }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, item, picked, left]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'play') return undefined;
    const onKey = (e) => {
      const k = Number(e.key);
      if (k >= 1 && k <= 4) answer(k - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function share() {
    if (!result) return;
    const url = `https://mindloftdaily.com/iq/${test.slug}`;
    const text = `My Mind Loft ${test.name} IQ: ${result.iq} (${ordinalPct(result.pct)} percentile). ${right} of ${answers.length} right.`;
    try {
      if (navigator.share) { await navigator.share({ text, url }); return; }
    } catch (e) { return; }
    try { await navigator.clipboard.writeText(`${text} ${url}`); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (e) {}
  }

  const others = IQ_TESTS.filter((t) => t.slug !== test.slug);
  const n = answers.length + (item ? 1 : 0);
  const RING = 2 * Math.PI * 88;

  return (
    <CircuitFrame cat={cat} label="IQ Tests" progress={phase === 'play' ? answers.length / MAX_ITEMS : phase === 'done' ? 1 : 0}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="iqt">
        {phase === 'intro' && (
          <section className="iqt-intro">
            <div className="iqt-eb">IQ test · {test.short} · {MIN_ITEMS} to {MAX_ITEMS} questions · about 8 minutes</div>
            <h1 className="iqt-h1">{test.name} IQ Test</h1>
            <p className="iqt-p">
              An adaptive {test.name.toLowerCase()} test drawn from {bankSize.toLocaleString()} questions that have
              already run on the Mind Loft daily gauntlets. Every one was calibrated on how real players did on it:
              the gauntlets are one life and asked in a fixed order, so each day shows exactly who reached a question
              and who got past it. {measured.toLocaleString()} of them rest on five or more of those runs.
            </p>
            <p className="iqt-p">
              After each answer the next question is picked to be the most informative at your current level, so it
              gets harder when you are right and easier when you are not. You get {MIN_ITEMS} questions, and up
              to {MAX_ITEMS - MIN_ITEMS} more if the estimate is still loose. Twenty seconds a question, the same clock
              the difficulties were measured under.
            </p>
            <p className="iqt-p iqt-mute">
              The score is IQ shaped but player normed: 100 is the typical Mind Loft player and 15 points is one standard
              deviation of that field. It measures what you know about {test.short.toLowerCase()} against the people who
              play here. Nothing is posted anywhere; your result
              stays on this device.
            </p>
            {prior && prior.best ? (
              <p className="iqt-prior">Your best here: IQ {prior.best.iq} · {ordinalPct(prior.best.pct)} percentile</p>
            ) : null}
            <button type="button" className="iqt-go" onClick={start}>Begin the test</button>
          </section>
        )}

        {phase === 'play' && item && (
          <section className="iqt-play" aria-live="polite">
            <div className="iqt-num">{n}</div>
            <div className="iqt-of">{n} of at most {MAX_ITEMS}</div>
            <div className="iqt-clock" aria-hidden="true"><span style={{ width: `${(left / SECONDS_PER_ITEM) * 100}%` }} /></div>
            {item.lane ? <div className="iqt-lane">{item.lane}</div> : null}
            <h2 className="iqt-q">{item.q}</h2>
            <div className="iqt-ch">
              {item.choices.map((c, i) => {
                let cls = 'iqt-c';
                if (picked) {
                  if (i === item.correct) cls += ' ok';
                  else if (i === picked.choice) cls += ' no';
                  else cls += ' dim';
                }
                return (
                  <button key={i} type="button" className={cls} onClick={() => answer(i)} disabled={!!picked}>
                    <span className="iqt-k">{i + 1}</span>{c}
                  </button>
                );
              })}
            </div>
            <div className="iqt-foot">{left}s · from {item.src}</div>
          </section>
        )}

        {phase === 'done' && result && (() => {
          // The reveal's frame at time tr (seconds; 99 = settled).
          const sweep = ease(clamp01((tr - 0.7) / 1.2));
          const pctNow = result.pct * sweep;
          const iqNow = tr >= 99 ? result.iq : Math.round(70 + (result.iq - 70) * sweep);
          const pulses = result.iq >= 130 ? [1.9, 2.3] : [1.9];
          const pulse = pulses.map((p0) => (tr - p0) / 0.7).find((q) => q >= 0 && q <= 1);
          const bellT = ease(clamp01((tr - 2.05) / 0.6));
          const areaT = ease(clamp01((tr - 2.3) / 0.6));
          const pinT = ease(clamp01((tr - 2.7) / 0.35));
          const iqClamp = Math.max(56, Math.min(144, result.iq));
          const mx = bx(iqClamp), my = by(iqClamp);
          const shown = (at) => (tr >= at ? ' in' : '');
          return (
          <>
            <section className="iqt-card" ref={cardRef}>
              <div className={'iqt-scoring' + (tr < 0.7 ? ' on' : '')}>Scoring {answers.length} answers</div>
              <div className="iqt-ring">
                <svg viewBox="0 0 200 200" aria-hidden="true" style={{ overflow: 'visible' }}>
                  <circle cx="100" cy="100" r="88" className="iqt-rtrack" />
                  <circle cx="100" cy="100" r="88" className="iqt-rglow"
                    strokeDasharray={`${(RING * Math.min(99.5, pctNow)) / 100} ${RING}`} transform="rotate(-90 100 100)" />
                  <circle cx="100" cy="100" r="88" className="iqt-rbar"
                    strokeDasharray={`${(RING * Math.min(99.5, pctNow)) / 100} ${RING}`} transform="rotate(-90 100 100)" />
                  {pulse !== undefined ? (
                    <circle cx="100" cy="100" r={88 + pulse * 22} className="iqt-rpulse" style={{ opacity: (1 - pulse) * 0.8 }} />
                  ) : null}
                  {tr < 1.7 ? answers.map((a, i) => {
                    const ang0 = (i / answers.length) * Math.PI * 2 - Math.PI / 2;
                    const spin = clamp01(tr / 0.7);
                    const r = 44 + 44 * ease(spin);
                    const ang = ang0 + (1 - ease(spin)) * 2.4;
                    const drain = (tr - 0.7 - i * 0.025) / 0.35;
                    const op = (drain > 0 ? Math.max(0, 1 - drain) : 1) * Math.min(1, tr * 4);
                    return (
                      <circle key={i} cx={100 + r * Math.cos(ang)} cy={100 + r * Math.sin(ang)} r={a.right ? 3.4 : 2.5}
                        className={a.right ? 'iqt-pip ok' : 'iqt-pip'} style={{ opacity: a.right ? op : op * 0.5 }} />
                    );
                  }) : null}
                </svg>
                <div className="iqt-rin">
                  <b>{sweep > 0 ? ordinalPct(Math.max(1, pctNow)) : ' '}</b>
                  <small className="iqt-rpl">Percentile</small>
                  <span className={'iqt-fade' + shown(0.9)}>IQ {iqNow} ± {result.pm}</span>
                </div>
              </div>
              <div className={'iqt-rname iqt-fade' + shown(1.4)}>{test.name} IQ {result.iq}</div>
              <div className={'iqt-rsub iqt-fade' + shown(1.4)}>
                {right} of {answers.length} correct · the test aims for about three in five
              </div>
              <svg className={'iqt-bell iqt-fade' + shown(2.0)} viewBox={`0 0 ${BW} 92`} aria-hidden="true">
                <defs><clipPath id="iqt-clip"><rect x="0" y="0" width={mx * areaT} height="92" /></clipPath></defs>
                <path d={AREA} className="iqt-barea" clipPath="url(#iqt-clip)" />
                <path d={BELL} className="iqt-bline" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - bellT} />
                <line x1="0" x2={BW} y1={BBASE} y2={BBASE} className="iqt-baxis" />
                {[70, 85, 100, 115, 130].map((v) => (
                  <text key={v} x={bx(v)} y={BBASE + 12} className="iqt-btick" textAnchor="middle">{v}</text>
                ))}
                <g style={{ opacity: pinT }} transform={`translate(0 ${-14 * (1 - pinT)})`}>
                  <line x1={mx} x2={mx} y1={my - 6} y2={BBASE} className="iqt-bpin" />
                  <circle cx={mx} cy={my - 6} r="5" className="iqt-bdot" />
                  <text x={Math.min(BW - 12, Math.max(12, mx))} y={Math.max(9, my - 14)} className="iqt-byou" textAnchor="middle">You</text>
                </g>
              </svg>
              <div className={'iqt-rnote iqt-fade' + shown(2.9)}>Percentile among Mind Loft players</div>
              <div className={'iqt-brand iqt-fade' + shown(2.9)}>Mind <em>Loft</em> · mindloftdaily.com/iq</div>
            </section>

            <section className="iqt-below">
              <div className="iqt-acts">
                <button type="button" className="iqt-go" onClick={share}>{copied ? 'Copied' : 'Share your result'}</button>
                <button type="button" className="iqt-ghost" onClick={start}>Take it again</button>
              </div>

              {plan && plan.run.length ? (
                <div className="iqt-run" ref={runRef} onPointerDown={(e) => { if (!e.target.closest('a,button')) setCdPaused(true); }}>
                  <div className="iqt-oeb">Your run · built from today&rsquo;s dailies</div>
                  <div className="iqt-runc">
                    <div className="iqt-runtop">
                      <div className="iqt-cd" aria-hidden="true">
                        <svg viewBox="0 0 54 54"><circle cx="27" cy="27" r="23" className="iqt-cdt" />
                          <circle cx="27" cy="27" r="23" className="iqt-cda" strokeDasharray="144.5" strokeDashoffset={144.5 * (1 - cd / 8)} /></svg>
                        <b>{cdPaused ? 'II' : cd}</b>
                      </div>
                      <div className="iqt-runnm">
                        <b>{(DAILY_GAME_MAP[plan.run[0]] || {}).name}</b>
                        <i>{(DAILY_GAME_MAP[plan.run[0]] || {}).tag}</i>
                      </div>
                    </div>
                    <div className="iqt-queue">
                      {plan.run.map((k, i) => (
                        <React.Fragment key={k}>
                          {i ? <span className="iqt-qar">›</span> : null}
                          <span className={'iqt-q1' + (i === 0 ? ' now' : '')}>{(DAILY_GAME_MAP[k] || {}).name}</span>
                        </React.Fragment>
                      ))}
                      <span className="iqt-qn">{plan.run.length} {plan.run.length === 1 ? 'game' : 'games'}</span>
                    </div>
                    <div className="iqt-rgo">
                      <button type="button" className="iqt-ghost" onClick={() => setCdPaused(true)}>Not now</button>
                      <a className="iqt-go" href={runHref}>{plan.run.length > 1 ? 'Start the run' : 'Play'}</a>
                    </div>
                  </div>

                  <div className="iqt-day">
                    <div className="iqt-dayl"><span><b>{plan.played} of {plan.total}</b> of today&rsquo;s dailies played</span></div>
                    <div className="iqt-prog">
                      {Array.from({ length: Math.min(plan.total, 40) }).map((_, i) => {
                        const scale = plan.total > 40 ? plan.total / 40 : 1;
                        const idx = i * scale;
                        const cls = idx < plan.played ? ' d' : idx < plan.played + plan.run.length ? ' n' : '';
                        return <i key={i} className={cls} />;
                      })}
                    </div>
                  </div>

                  {plan.swaps.length ? (
                    <div className="iqt-swaps">
                      <div className="iqt-oeb">Or play instead</div>
                      <div className="iqt-ogrid">
                        {plan.swaps.map((k) => {
                          const g = DAILY_GAME_MAP[k];
                          return (
                            <a key={k} href={g.href} className="iqt-o iqt-sw">
                              {glyphFor(k) ? (
                                <svg viewBox={GLYPH_BOX} width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"
                                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={glyphFor(k)} /></svg>
                              ) : null}
                              <span><b>{g.name}</b><i>{g.tag}</i></span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="iqt-oth">
                <div className="iqt-oeb">Next IQ test</div>
                <div className="iqt-ogrid">
                  {others.map((t) => (
                    <a key={t.slug} href={`/iq/${t.slug}`} className="iqt-o"
                      style={{ '--oc': `var(--iq-r${t.ramp})` }}>{t.name}</a>
                  ))}
                </div>
                <a className="iqt-all" href="/iq">All IQ tests</a>
              </div>
            </section>

            {runHref ? (
              <div className={'iqt-sticky' + (runPast ? ' on' : '')} aria-hidden={!runPast}>
                <span><b>Continue your run</b><small>{plan.run.map((k) => (DAILY_GAME_MAP[k] || {}).name).join(', then ')}</small></span>
                <a href={runHref} tabIndex={runPast ? 0 : -1}>Play</a>
              </div>
            ) : null}
          </>
          );
        })()}
      </div>
    </CircuitFrame>
  );
}

// NOTE: a JS template literal, so no backticks in the comments.
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";


const CSS = IQ_RAMP_CSS + `
.iqt{max-width:680px;margin:0 auto;}
.iqt-intro{text-align:center;padding:18px 0 30px;}
.iqt-eb{font-family:${MONO};font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-mute);}
.iqt-h1{margin:12px 0 16px;font-size:40px;font-weight:800;letter-spacing:-0.025em;line-height:1.08;color:var(--stg-ink);}
.iqt-p{margin:0 auto 12px;font-size:15.5px;font-weight:600;line-height:1.62;color:var(--stg-ink2);max-width:60ch;}
.iqt-mute{color:var(--stg-mute);font-size:14px;}
.iqt-prior{margin:16px 0 0;font-family:${MONO};font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--stg-acc-ink,var(--stg-acc));}
.iqt-go{margin-top:22px;border:none;border-radius:10px;padding:14px 26px;font:inherit;font-size:15px;font-weight:800;
  background:var(--stg-acc);color:var(--stg-onramp);cursor:pointer;}
.iqt-go:focus-visible,.iqt-ghost:focus-visible,.iqt-c:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.iqt-ghost{margin-top:22px;border:1px solid var(--stg-line);border-radius:10px;padding:13px 22px;font:inherit;font-size:15px;
  font-weight:700;background:none;color:var(--stg-ink);cursor:pointer;}

.iqt-play{text-align:center;padding:6px 0 30px;}
.iqt-num{font-size:64px;font-weight:800;line-height:1;color:var(--stg-surf2);letter-spacing:-0.03em;}
.iqt-of{margin-top:6px;font-family:${MONO};font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-mute);}
.iqt-clock{height:3px;max-width:420px;margin:14px auto 0;background:var(--stg-surf2);border-radius:2px;overflow:hidden;}
.iqt-clock span{display:block;height:100%;background:var(--stg-acc);transition:width 1s linear;}
.iqt-lane{display:inline-block;margin-top:18px;font-family:${MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase;
  padding:4px 9px;border-radius:999px;background:var(--stg-chip);color:var(--stg-ink2);}
.iqt-q{margin:14px auto 22px;font-size:24px;font-weight:700;line-height:1.35;color:var(--stg-ink);max-width:34ch;}
.iqt-ch{display:flex;flex-direction:column;gap:10px;max-width:460px;margin:0 auto;}
.iqt-c{position:relative;display:block;width:100%;border:1px solid var(--stg-line);border-radius:10px;padding:15px 44px;
  background:var(--stg-surf);color:var(--stg-ink);font:inherit;font-size:16px;font-weight:600;cursor:pointer;text-align:center;
  transition:border-color .15s,background .15s;}
.iqt-c:hover:not(:disabled){border-color:var(--stg-acc);}
.iqt-c:disabled{cursor:default;}
.iqt-k{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-family:${MONO};font-size:10px;color:var(--stg-mute);}
.iqt-c.ok{border-color:var(--stg-good);background:color-mix(in srgb,var(--stg-good) 18%,transparent);}
.iqt-c.no{border-color:var(--stg-bad);background:color-mix(in srgb,var(--stg-bad) 16%,transparent);}
.iqt-c.dim{opacity:.55;}
.iqt-foot{margin-top:16px;font-family:${MONO};font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-mute);}

/* THE CARD IS THE VIEWPORT, less the cap above it, so a screenshot of the
   screen is the card and nothing past it. */
.iqt-card{min-height:calc(100svh - 110px);display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:10px 0 24px;}
.iqt-ring{position:relative;width:min(250px,62vw);aspect-ratio:1;}
.iqt-ring svg{width:100%;height:100%;display:block;}
.iqt-rtrack{fill:none;stroke:var(--stg-surf2);stroke-width:7;}
.iqt-rbar{fill:none;stroke:var(--stg-acc);stroke-width:7;stroke-linecap:round;}
.iqt-rin{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.iqt-rin b{font-size:clamp(46px,14vw,68px);font-weight:800;letter-spacing:-0.03em;line-height:1;color:var(--stg-ink);}
.iqt-rpl{margin-top:6px;font-family:${MONO};font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--stg-mute);}
.iqt-rin span{margin-top:8px;font-family:${MONO};font-size:13px;letter-spacing:.06em;color:var(--stg-ink2);}
.iqt-rname{margin-top:18px;font-size:clamp(28px,7vw,40px);font-weight:800;letter-spacing:-0.02em;color:var(--stg-ink);}
.iqt-rsub{margin-top:12px;font-family:${MONO};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-ink2);
  max-width:46ch;line-height:1.7;}
.iqt-rnote{margin-top:10px;font-size:12.5px;font-weight:600;color:var(--stg-mute);}
.iqt-brand{margin-top:16px;font-size:13px;font-weight:800;color:var(--stg-ink2);letter-spacing:-0.005em;}
.iqt-brand em{font-style:normal;color:var(--stg-brand,#7dd3fc);}

.iqt-below{padding:30px 0 10px;border-top:1px solid var(--stg-line);}
.iqt-acts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
.iqt-acts .iqt-go,.iqt-acts .iqt-ghost{margin-top:0;}
.iqt-next{display:block;margin-top:26px;text-decoration:none;color:var(--stg-ink);background:var(--stg-surf);
  border:1px solid var(--stg-line);border-left:4px solid var(--stg-acc);border-radius:10px;padding:14px 16px;}
.iqt-next:hover{border-color:var(--stg-acc);}
.iqt-neb{display:block;font-family:${MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute);}
.iqt-nrow{display:flex;align-items:center;gap:14px;margin-top:9px;}
.iqt-nrow svg{flex:none;color:var(--stg-acc-ink,var(--stg-acc));}
.iqt-nt{display:flex;flex-direction:column;min-width:0;flex:1;}
.iqt-nt b{font-size:18px;font-weight:800;}
.iqt-nt i{font-style:normal;font-size:13px;font-weight:600;color:var(--stg-ink2);line-height:1.45;margin-top:2px;}
.iqt-play-btn{flex:none;border-radius:8px;padding:9px 16px;font-size:14px;font-weight:800;background:var(--stg-acc);color:var(--stg-onramp);}
.iqt-oth{margin-top:28px;}
.iqt-oeb{font-family:${MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute);margin-bottom:10px;}
.iqt-ogrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;}
.iqt-o{position:relative;display:block;text-decoration:none;color:var(--stg-ink);background:var(--stg-surf);border:1px solid var(--stg-line);
  border-radius:9px;padding:11px 12px 11px 16px;font-size:14px;font-weight:700;overflow:hidden;}
.iqt-o::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--oc);}
.iqt-o:hover{border-color:var(--oc);}
.iqt-all{display:inline-block;margin-top:14px;font-size:13px;font-weight:700;color:var(--stg-acc-ink,var(--stg-acc));}

.iqt-scoring{height:16px;margin-bottom:10px;font-family:${MONO};font-size:10px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--stg-mute);opacity:0;transition:opacity .4s;}
.iqt-scoring.on{opacity:1;}
.iqt-rglow{fill:none;stroke:var(--stg-acc);stroke-width:12;stroke-linecap:round;opacity:.25;filter:blur(3px);}
.iqt-rpulse{fill:none;stroke:var(--stg-acc);stroke-width:2;}
.iqt-pip{fill:var(--stg-mute);}
.iqt-pip.ok{fill:var(--stg-good);}
.iqt-fade{opacity:0;transform:translateY(8px);transition:opacity .5s ease,transform .5s ease;}
.iqt-fade.in{opacity:1;transform:none;}
.iqt-bell{display:block;width:min(360px,86vw);height:auto;aspect-ratio:300/92;margin-top:18px;overflow:visible;}
.iqt-bline{fill:none;stroke:var(--stg-mute);stroke-width:1.5;}
.iqt-barea{fill:color-mix(in srgb,var(--stg-acc) 22%,transparent);}
.iqt-baxis{stroke:var(--stg-line);stroke-width:1;}
.iqt-btick{font-family:${MONO};font-size:8px;fill:var(--stg-mute);}
.iqt-bpin{stroke:var(--stg-acc);stroke-width:2;}
.iqt-bdot{fill:var(--stg-acc);}
.iqt-byou{font-size:9px;font-weight:800;fill:var(--stg-acc-ink,var(--stg-acc));}

.iqt-run{margin-top:28px;}
.iqt-runc{background:var(--stg-surf);border:1px solid var(--stg-line);border-left:4px solid var(--stg-acc);border-radius:12px;padding:14px;}
.iqt-runtop{display:flex;gap:12px;align-items:center;}
.iqt-cd{position:relative;width:54px;height:54px;flex:none;}
.iqt-cd svg{position:absolute;inset:0;transform:rotate(-90deg);}
.iqt-cdt{fill:none;stroke:var(--stg-surf2);stroke-width:4;}
.iqt-cda{fill:none;stroke:var(--stg-acc);stroke-width:4;stroke-linecap:round;transition:stroke-dashoffset 1s linear;}
.iqt-cd b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;color:var(--stg-ink);}
.iqt-runnm{display:flex;flex-direction:column;min-width:0;}
.iqt-runnm b{font-size:18px;font-weight:800;color:var(--stg-ink);}
.iqt-runnm i{font-style:normal;font-size:13px;font-weight:600;color:var(--stg-ink2);}
.iqt-queue{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:12px;font-size:12px;font-weight:700;}
.iqt-q1{padding:4px 10px;border-radius:999px;border:1px solid var(--stg-line);color:var(--stg-ink2);}
.iqt-q1.now{border-color:var(--stg-acc);color:var(--stg-acc-ink,var(--stg-acc));}
.iqt-qar{color:var(--stg-mute);}
.iqt-qn{margin-left:auto;font-family:${MONO};font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-mute);}
.iqt-rgo{display:flex;gap:8px;margin-top:14px;}
.iqt-rgo .iqt-go,.iqt-rgo .iqt-ghost{margin-top:0;flex:1;text-align:center;text-decoration:none;}
.iqt-day{margin-top:14px;background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:12px;padding:12px 14px;}
.iqt-dayl{font-size:13px;font-weight:600;color:var(--stg-ink2);}
.iqt-dayl b{color:var(--stg-ink);}
.iqt-prog{display:flex;gap:3px;margin-top:9px;}
.iqt-prog i{flex:1;height:6px;border-radius:3px;background:var(--stg-surf2);}
.iqt-prog i.d{background:var(--stg-good);}
.iqt-prog i.n{background:var(--stg-acc);}
.iqt-swaps{margin-top:14px;}
.iqt-sw{display:flex;align-items:center;gap:10px;}
.iqt-sw svg{flex:none;color:var(--stg-acc-ink,var(--stg-acc));}
.iqt-sw span{display:flex;flex-direction:column;min-width:0;}
.iqt-sw i{font-style:normal;font-size:12px;font-weight:600;color:var(--stg-ink2);}
.iqt-sticky{position:fixed;left:50%;bottom:14px;z-index:60;width:min(520px,calc(100vw - 24px));transform:translate(-50%,140%);
  display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:var(--stg-ink);color:var(--stg-ground);
  box-shadow:0 14px 34px -10px rgba(0,0,0,.45);transition:transform .45s cubic-bezier(.2,.9,.3,1.2);}
.iqt-sticky.on{transform:translate(-50%,0);}
.iqt-sticky span{display:flex;flex-direction:column;min-width:0;line-height:1.25;}
.iqt-sticky b{font-size:14px;font-weight:800;}
.iqt-sticky small{font-size:11.5px;font-weight:600;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.iqt-sticky a{margin-left:auto;flex:none;background:var(--stg-acc);color:var(--stg-onramp);border-radius:10px;padding:9px 16px;font-weight:800;font-size:14px;text-decoration:none;}
@media (prefers-reduced-motion:reduce){.iqt-fade,.iqt-sticky,.iqt-cda{transition:none;}}

@media (max-width:640px){
  .iqt-h1{font-size:30px;}
  .iqt-q{font-size:20px;}
  .iqt-num{font-size:52px;}
  .iqt-card{min-height:calc(100svh - 96px);}
}
@media (prefers-reduced-motion:reduce){.iqt-clock span{transition:none;}}
`;
