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
import { DAILY_GAMES, isRetiredDaily } from '@/lib/daily-games';
import { glyphFor, GLYPH_BOX } from '@/lib/game-glyphs';
import { IQ_RAMP_CSS } from '@/lib/iq-style';
import { fetchDailyMe, dailyMeQuery, dailyMeIdentity } from '../../dailyMeClient';

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

function useNextDaily(slug, active) {
  const [next, setNext] = useState(null);
  useEffect(() => {
    if (!active) return undefined;
    let alive = true;
    const live = DAILY_GAMES.filter((g) => !isRetiredDaily(g.key));
    const pref = (NEXT_FOR[slug] || []).map((k) => live.find((g) => g.key === k)).filter(Boolean);
    const order = [...pref, ...live.filter((g) => !pref.includes(g))];
    setNext(order[0] || null);
    fetchDailyMe(dailyMeQuery(dailyMeIdentity()))
      .then((d) => {
        if (!alive) return;
        const per = (d && d.perGame) || {};
        const open = order.find((g) => !(per[g.key] && !per[g.key].abandoned));
        if (open) setNext(open);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [slug, active]);
  return next;
}

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
  const next = useNextDaily(test.slug, phase === 'done');

  function start() {
    usedRef.current = new Set();
    lockRef.current = false;
    setAnswers([]);
    setPicked(null);
    // Open a little above the typical player: a first question that is too
    // easy teaches the estimate nothing.
    const first = nextItem(model, pool, 0.3, usedRef.current, null);
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
      const nx = nextItem(model, pool, e.mean, usedRef.current, item.lane);
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

        {phase === 'done' && result && (
          <>
            <section className="iqt-card" ref={cardRef}>
              <div className="iqt-ring">
                <svg viewBox="0 0 200 200" aria-hidden="true">
                  <circle cx="100" cy="100" r="88" className="iqt-rtrack" />
                  <circle cx="100" cy="100" r="88" className="iqt-rbar"
                    strokeDasharray={`${(RING * Math.min(99.5, result.pct)) / 100} ${RING}`} transform="rotate(-90 100 100)" />
                </svg>
                <div className="iqt-rin">
                  <b>{ordinalPct(result.pct)}</b>
                  <span>IQ {result.iq} ± {result.pm}</span>
                </div>
              </div>
              <div className="iqt-rname">{test.name} IQ {result.iq}</div>
              <div className="iqt-rsub">
                {right} of {answers.length} correct · the test aims for about three in five
              </div>
              <div className="iqt-rnote">Percentile among Mind Loft players</div>
              <div className="iqt-brand">Mind <em>Loft</em> · mindloftdaily.com/iq</div>
            </section>

            <section className="iqt-below">
              <div className="iqt-acts">
                <button type="button" className="iqt-go" onClick={share}>{copied ? 'Copied' : 'Share your result'}</button>
                <button type="button" className="iqt-ghost" onClick={start}>Take it again</button>
              </div>

              {next ? (
                <a className="iqt-next" href={next.href}>
                  <span className="iqt-neb">Up next · today&rsquo;s daily puzzle</span>
                  <span className="iqt-nrow">
                    {glyphFor(next.key) ? (
                      <svg viewBox={GLYPH_BOX} width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={glyphFor(next.key)} /></svg>
                    ) : null}
                    <span className="iqt-nt">
                      <b>{next.name}</b>
                      <i>{next.how || next.tag}</i>
                    </span>
                    <span className="iqt-play-btn">Play</span>
                  </span>
                </a>
              ) : null}

              <div className="iqt-oth">
                <div className="iqt-oeb">The other tests</div>
                <div className="iqt-ogrid">
                  {others.map((t) => (
                    <a key={t.slug} href={`/iq/${t.slug}`} className="iqt-o"
                      style={{ '--oc': `var(--iq-r${t.ramp})` }}>{t.name}</a>
                  ))}
                </div>
                <a className="iqt-all" href="/iq">All IQ tests</a>
              </div>
            </section>
          </>
        )}
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
.iqt-ring{position:relative;width:min(280px,72vw);aspect-ratio:1;}
.iqt-ring svg{width:100%;height:100%;display:block;}
.iqt-rtrack{fill:none;stroke:var(--stg-surf2);stroke-width:7;}
.iqt-rbar{fill:none;stroke:var(--stg-acc);stroke-width:7;stroke-linecap:round;}
.iqt-rin{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.iqt-rin b{font-size:clamp(46px,14vw,68px);font-weight:800;letter-spacing:-0.03em;line-height:1;color:var(--stg-ink);}
.iqt-rin span{margin-top:8px;font-family:${MONO};font-size:13px;letter-spacing:.06em;color:var(--stg-ink2);}
.iqt-rname{margin-top:26px;font-size:clamp(28px,7vw,40px);font-weight:800;letter-spacing:-0.02em;color:var(--stg-ink);}
.iqt-rsub{margin-top:12px;font-family:${MONO};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-ink2);
  max-width:46ch;line-height:1.7;}
.iqt-rnote{margin-top:10px;font-size:12.5px;font-weight:600;color:var(--stg-mute);}
.iqt-brand{margin-top:26px;font-size:13px;font-weight:800;color:var(--stg-ink2);letter-spacing:-0.005em;}
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

@media (max-width:640px){
  .iqt-h1{font-size:30px;}
  .iqt-q{font-size:20px;}
  .iqt-num{font-size:52px;}
  .iqt-card{min-height:calc(100svh - 96px);}
}
@media (prefers-reduced-motion:reduce){.iqt-clock span{transition:none;}}
`;
