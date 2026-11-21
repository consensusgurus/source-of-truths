'use client';

// THE TRIVIA PORTAL (owner, 2026-11-21: "make the site the top spot for multiple
// choice trivia ... maybe users can play old questions by topic in same
// format", then "What about trivia portal? I asked for that too with same SEO").
// Design: the "Trivia Portal Mockup" canvas.
//
// One client for the hub (/trivia-questions) and each topic page
// (/trivia-questions/<topic>). Every question already ran as a daily, so the
// archive can never spoil a coming day (lib/trivia-library.js). A game plays on
// the same GauntletStage the dailies use, in four modes:
//   Gauntlet  one life, the clock per question, gimme to expert
//   Practice  no lives and no clock; a miss shows the right answer, play on
//   Sprint    as many as you can in 60 seconds
//   Streak    one life, no end until you miss
// Nothing posts to the server or counts toward points; the record (seen, right,
// best scores, missed questions) is this browser's (STORE_KEY).
//
// SERVER HTML IS THE CRAWL PATH: topic names are real links to their pages, and
// the sample questions with answers print in the page.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CircuitFrame from '../circuits/CircuitFrame';
import GauntletStage, { MISS_MS } from '../GauntletStage';
import { softGround, RAMP_INK } from '@/lib/category-ramp';
import { MODES, LEVELS, COUNTS, Q_SECONDS, SPRINT_SECONDS, STORE_KEY, MISS_CAP } from '@/lib/trivia-topics';

const HUE = '#fdbe8a'; // the Trivia category pastel
const SET_KEY = 'sot_trivia_setup';

const ICON = {
  brain: 'M7 5a3 3 0 0 0-3 3v1a3 3 0 0 0 0 5 3 3 0 0 0 4 3 2 2 0 0 0 2-2V6a2 2 0 0 0-3-1zM13 5a3 3 0 0 1 3 3v1a3 3 0 0 1 0 5 3 3 0 0 1-4 3 2 2 0 0 1-2-2',
  globe: 'M3 10h14M10 3c2.5 2.5 2.5 11.5 0 14M10 3c-2.5 2.5-2.5 11.5 0 14M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  ball: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0M10 6l3 2.2-1.2 3.6H8.2L7 8.2z',
  chart: 'M3 17h14M5 14l4-4 3 3 5-6',
  film: 'M5 4h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 8h14M3 12h14M7 4v12M13 4v12',
  quote: 'M5 13c0-4 2-6 4-6M11 13c0-4 2-6 4-6M5 13h3v3H5zM11 13h3v3h-3z',
  flask: 'M8 3h4M9 3v5l-5 8a1 1 0 0 0 1 1.5h10a1 1 0 0 0 1-1.5l-5-8V3',
  col: 'M3 7l7-4 7 4M4 7h12M5 7v8M9 7v8M11 7v8M15 7v8M3 16h14',
  brush: 'M14 3l3 3-7 7-3-3zM7 10c-2 0-3 2-3 4 0 1-1 2-1 2 3 0 6-1 6-4',
  fork: 'M6 3v5a2 2 0 0 0 4 0V3M8 8v9M14 3c-2 2-2 6 0 7v7',
  abc: 'M3 15l3-9 3 9M4 12h4M11 6h3a2 2 0 0 1 0 4h-3zM11 10h3.5a2.5 2.5 0 0 1 0 5H11z',
  dive: 'M10 3v10M6 9l4 4 4-4M4 17h12',
  mix: 'M3 6h3l8 8h3M3 14h3l2-2M12 8l2-2h3M15 4l2 2-2 2M15 12l2 2-2 2',
};
const Icon = ({ k }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICON[k] || ICON.brain} /></svg>
);

function readStore() {
  try { const s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); if (s && typeof s === 'object') return { t: s.t || {}, l: s.l || {}, b: s.b || {}, m: Array.isArray(s.m) ? s.m : [] }; } catch (e) {}
  return { t: {}, l: {}, b: {}, m: [] };
}
function writeStore(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {} }
const pct = (a) => (a && a[0] ? Math.round((a[1] / a[0]) * 100) : 0);
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

export default function TriviaPortal({ topics, topic = null, samples = [], faq = [], total = 0, crumbs = [] }) {
  const [setup, setSetup] = useState({ mode: 'gauntlet', level: 'ramp', n: 25 });
  const [store, setStore] = useState({ t: {}, l: {}, b: {}, m: [] });
  const [lanes, setLanes] = useState(() => new Set());
  const [hydrated, setHydrated] = useState(false);
  const [game, setGame] = useState(null); // { qs, mode, title, color, key, slug }
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [laneQ, setLaneQ] = useState('');

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(SET_KEY) || 'null'); if (s && MODES.some((m) => m.key === s.mode)) setSetup((x) => ({ ...x, ...s })); } catch (e) {}
    setStore(readStore());
    setHydrated(true);
  }, []);
  const pick = (k, v) => setSetup((s) => { const n2 = { ...s, [k]: v }; try { localStorage.setItem(SET_KEY, JSON.stringify(n2)); } catch (e) {} return n2; });

  const start = useCallback(async (slug, opts = {}) => {
    const t = slug === 'mix' ? { slug: 'mix', label: 'Mixed Bag', color: HUE } : topics.find((x) => x.slug === slug);
    if (!t) return;
    const mode = opts.mode || setup.mode;
    const n = mode === 'sprint' || mode === 'streak' ? 120 : setup.n;
    const params = new URLSearchParams();
    if (opts.ids) params.set('ids', opts.ids.join(','));
    else {
      params.set('t', slug);
      if (opts.lanes && opts.lanes.length) params.set('l', opts.lanes.join('|'));
      params.set('lv', mode === 'sprint' || mode === 'streak' ? 'ramp' : setup.level);
      params.set('n', String(n));
      params.set('s', String(Math.floor(Math.random() * 1000)));
    }
    setLoading(true); setErr('');
    try {
      const r = await fetch(`/api/trivia/set?${params.toString()}`);
      const d = await r.json();
      if (!d || !Array.isArray(d.qs) || !d.qs.length) throw new Error('empty');
      setGame({ qs: d.qs, mode, title: opts.title || t.label, color: t.color, slug, key: `${slug}|${mode}|${mode === 'sprint' || mode === 'streak' ? 0 : n}`, lanes: opts.lanes || [], retry: !!opts.ids });
    } catch (e) {
      setErr('Those questions could not be loaded. Try again in a moment.');
    }
    setLoading(false);
  }, [setup, topics]);

  const onAnswer = useCallback((q, right) => {
    setStore((s0) => {
      const s = { t: { ...s0.t }, l: { ...s0.l }, b: s0.b, m: s0.m };
      const tk = q.t || (topic && topic.slug) || 'mix';
      const a = s.t[tk] || [0, 0]; s.t[tk] = [a[0] + 1, a[1] + (right ? 1 : 0)];
      const lk = `${tk}|${q.lane}`; const b = s.l[lk] || [0, 0]; s.l[lk] = [b[0] + 1, b[1] + (right ? 1 : 0)];
      s.m = right ? s0.m.filter((k) => k !== q.k) : [q.k, ...s0.m.filter((k) => k !== q.k)].slice(0, MISS_CAP);
      writeStore(s);
      return s;
    });
  }, [topic]);
  const onDone = useCallback((key, score) => {
    setStore((s0) => {
      if ((s0.b[key] || 0) >= score) return s0;
      const s = { ...s0, b: { ...s0.b, [key]: score } };
      writeStore(s);
      return s;
    });
  }, []);

  // Weakest lane with at least twelve answers.
  const weak = useMemo(() => {
    let best = null;
    for (const [k, v] of Object.entries(store.l)) {
      if (!v || v[0] < 12 || k.startsWith('mix|')) continue;
      const p = v[1] / v[0];
      if (!best || p < best.p) best = { k, p, n: v[0] };
    }
    if (!best) return null;
    const [slug, lane] = best.k.split('|');
    const t = topics.find((x) => x.slug === slug);
    return t ? { slug, lane, label: t.label, p: Math.round(best.p * 100) } : null;
  }, [store, topics]);

  const controls = (
    <div className="tp-ctl" aria-label="Game settings">
      <div className="tp-grp">
        <span className="tp-lab" id="tp-lm">Mode</span>
        <div className="tp-seg tp-modes" role="group" aria-labelledby="tp-lm">
          {MODES.map((m) => (
            <button key={m.key} type="button" className={setup.mode === m.key ? 'on' : ''} aria-pressed={setup.mode === m.key} onClick={() => pick('mode', m.key)}>
              {m.label}<small>{m.sub}</small>
            </button>
          ))}
        </div>
      </div>
      {setup.mode === 'gauntlet' || setup.mode === 'practice' ? (
        <>
          <div className="tp-grp">
            <span className="tp-lab" id="tp-ll">Level</span>
            <div className="tp-seg sm" role="group" aria-labelledby="tp-ll">
              {LEVELS.map(([k, lab]) => <button key={k} type="button" className={setup.level === k ? 'on' : ''} aria-pressed={setup.level === k} onClick={() => pick('level', k)}>{lab}</button>)}
            </div>
          </div>
          <div className="tp-grp">
            <span className="tp-lab" id="tp-ln">Questions</span>
            <div className="tp-seg sm" role="group" aria-labelledby="tp-ln">
              {COUNTS.map((c) => <button key={c} type="button" className={setup.n === c ? 'on' : ''} aria-pressed={setup.n === c} onClick={() => pick('n', c)}>{c}</button>)}
            </div>
          </div>
        </>
      ) : <p className="tp-modenote">{setup.mode === 'sprint' ? 'Sixty seconds on the clock. Answer as many as you can; a miss costs time, not the game.' : 'One life and no finish line. The questions climb from gimme to expert until you miss.'}</p>}
    </div>
  );

  const playLabel = setup.mode === 'sprint' ? 'Start the Sprint' : setup.mode === 'streak' ? 'Start a Streak' : `Play ${setup.n}`;

  return (
    <CircuitFrame cat="Trivia" label="Trivia questions" wide bar={{ title: topic ? topic.label : 'Trivia Questions', sub: topic ? 'Trivia Questions' : 'Play any topic', dot: HUE }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <nav className="tp-crumb" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (i < crumbs.length - 1
          ? <span key={c.label}><a href={c.href}>{c.label}</a><span aria-hidden="true"> / </span></span>
          : <span key={c.label} aria-current="page">{c.label}</span>))}
      </nav>

      {!topic ? (
        <>
          <header className="tp-head">
            <div className="tp-htx">
              <h1>Trivia Questions</h1>
              <p className="tp-lede">
                {fmt(total)} free multiple choice trivia questions in {topics.length} topics, every one of them from a past Mind Loft daily.
                Play any topic in the same format as the daily gauntlets, or practice one lane with the answers shown. No signup.
              </p>
            </div>
            <div className="tp-today">
              <a className="tp-tc big" href="/trivia"><span className="tp-tk">Today, ranked</span><b>Trivia Gauntlet</b><small>Six quizzes, one life each. Your first try counts.</small></a>
              <a className="tp-tc" href="/encore"><span className="tp-tk">Today, ranked</span><b>Trivia Encore</b><small>Five more quizzes from the other banks.</small></a>
            </div>
          </header>

          <div className="tp-sh"><h2>Play by topic</h2><p>Pick a mode, then a topic. Open a topic to narrow it to the lanes you want.</p></div>
          {controls}
          {err ? <p className="tp-err" role="alert">{err}</p> : null}
          <ul className="tp-grid">
            {topics.map((t) => {
              const me = hydrated ? store.t[t.slug] : null;
              const seen = me ? me[0] : 0;
              return (
                <li key={t.slug} className="tp-tile" style={{ '--tc': softGround(t.color) }}>
                  <div className="tp-th">
                    <span className="tp-ic"><Icon k={t.icon} /></span>
                    <div><h3><a href={`/trivia-questions/${t.slug}`}>{t.label}</a></h3><span className="tp-cnt">{fmt(t.n)} questions</span></div>
                  </div>
                  <p className="tp-lanes">{t.slug === 'deep-cuts' ? `${t.lanes.length} single-topic quizzes, from ${t.lanes.slice(0, 3).map((l) => l[0]).join(', ')} on.` : t.lanes.slice(0, 6).map((l) => l[0]).join(' · ')}</p>
                  <div className="tp-prog">
                    <span className="tp-track"><span style={{ width: `${Math.min(100, (seen / Math.max(1, t.n)) * 100)}%` }} /></span>
                    <span>{seen ? `${fmt(seen)} seen · ${pct(me)}% right` : 'Not played yet'}</span>
                  </div>
                  <div className="tp-tf">
                    <button type="button" className="tp-go" onClick={() => start(t.slug)} disabled={loading}>{playLabel}</button>
                    <a className="tp-go lt" href={`/trivia-questions/${t.slug}`}>Pick lanes</a>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="tp-sh"><h2>Made for you</h2></div>
          <div className="tp-mine">
            <div className="tp-mc">
              <span className="tp-tk">Shuffle everything</span>
              <b>Mixed bag</b>
              <span>Questions from every topic at once, climbing from gimme to expert. A new mix every time.</span>
              <button type="button" className="tp-go" onClick={() => start('mix')} disabled={loading}>{playLabel}</button>
            </div>
            <div className="tp-mc">
              <span className="tp-tk">Fix a weak spot</span>
              <b>{weak ? `${weak.lane}, ${weak.p}% right` : 'Your weakest lane'}</b>
              <span>{weak ? `Your lowest lane in ${weak.label} so far. Practice mode shows the answer after every question.` : 'Answer a dozen questions in a lane and your weakest one shows up here, ready to practice.'}</span>
              <button type="button" className="tp-go lt" disabled={!weak || loading} onClick={() => weak && start(weak.slug, { mode: 'practice', lanes: [weak.lane], title: `${weak.label}: ${weak.lane}` })}>Practice it</button>
            </div>
            <div className="tp-mc">
              <span className="tp-tk">Missed questions</span>
              <b>{hydrated && store.m.length ? `${fmt(store.m.length)} you got wrong` : 'Questions you miss'}</b>
              <span>Every question you miss here comes back until you get it right, in Practice mode.</span>
              <button type="button" className="tp-go lt" disabled={!store.m.length || loading} onClick={() => start('mix', { mode: 'practice', ids: store.m.slice(0, 25), title: 'Your missed questions' })}>Retry my misses</button>
            </div>
          </div>
        </>
      ) : (
        <>
          <header className="tp-head">
            <div className="tp-htx">
              <h1>{topic.h1}</h1>
              <p className="tp-lede">{topic.blurb} {fmt(topic.n)} questions so far, every one from a past Mind Loft daily, free to play with no signup.</p>
            </div>
          </header>
          <div className="tp-two">
            <section aria-label="Lanes">
              <div className="tp-sh tight"><h2>{topic.slug === 'deep-cuts' ? 'Pick your quizzes' : 'Pick your lanes'}</h2><p>{lanes.size ? `${lanes.size} picked.` : 'All of them, unless you pick.'} {lanes.size ? <button type="button" className="tp-link" onClick={() => setLanes(new Set())}>Clear</button> : null}</p></div>
              {topic.lanes.length > 12 ? (
                <label className="tp-search"><input type="search" value={laneQ} onChange={(e) => setLaneQ(e.target.value)} placeholder="Find a topic: Rome, volcanoes, jazz" aria-label="Find a quiz topic" /></label>
              ) : null}
              <div className={`tp-lanelist${topic.lanes.length > 12 ? ' many' : ''}`}>
                {topic.lanes.filter(([l]) => !laneQ || l.toLowerCase().includes(laneQ.toLowerCase())).map(([l, n]) => {
                  const me = hydrated ? store.l[`${topic.slug}|${l}`] : null;
                  const on = lanes.has(l);
                  return (
                    <label key={l} className={`tp-ln${on ? ' on' : ''}`}>
                      <input type="checkbox" checked={on} onChange={() => setLanes((s) => { const n2 = new Set(s); if (n2.has(l)) n2.delete(l); else n2.add(l); return n2; })} />
                      <span className="tp-lnt"><b>{l}</b><span>{fmt(n)} questions{me ? ` · ${pct(me)}% right` : ''}</span></span>
                    </label>
                  );
                })}
              </div>
            </section>
            <aside className="tp-setup" aria-label="Play">
              {controls}
              {err ? <p className="tp-err" role="alert">{err}</p> : null}
              <button type="button" className="tp-go big" disabled={loading} onClick={() => start(topic.slug, { lanes: [...lanes] })}>
                {loading ? 'Loading' : `${playLabel}${setup.mode === 'sprint' || setup.mode === 'streak' ? '' : ` ${topic.label.toLowerCase()} questions`}`}
              </button>
              <div className="tp-best">
                <span className="tp-lab">Your record here</span>
                {hydrated && store.t[topic.slug] ? <span>{fmt(store.t[topic.slug][0])} answered, {pct(store.t[topic.slug])}% right</span> : <span>Nothing yet. Your record stays in this browser.</span>}
                {hydrated ? MODES.map((m) => {
                  const k = Object.keys(store.b).filter((x) => x.startsWith(`${topic.slug}|${m.key}|`));
                  const v = k.length ? Math.max(...k.map((x) => store.b[x])) : 0;
                  return v ? <span key={m.key}>{m.label} best: {v}{m.key === 'sprint' ? ' in 60 seconds' : m.key === 'streak' ? ' in a row' : ' right'}</span> : null;
                }) : null}
              </div>
            </aside>
          </div>

          {samples.length ? (
            <section className="tp-samples" aria-labelledby="tp-sq">
              <h2 id="tp-sq">Sample {topic.label.toLowerCase()} trivia questions and answers</h2>
              {samples.map((q) => (
                <details key={q.k}>
                  <summary>{q.q}</summary>
                  <p><b>Answer: {q.c[q.a]}.</b> The choices were {q.c.join(', ')}. ({q.lane}, {['', 'gimme', 'easy', 'medium', 'hard', 'expert'][q.tier] || 'medium'})</p>
                </details>
              ))}
              <p className="tp-note">Every question here has already run as a Mind Loft daily, so replaying it never spoils a future one. These samples change every week.</p>
            </section>
          ) : null}
        </>
      )}

      <nav className="tp-more" aria-label="Trivia topics">
        <h2>{topic ? 'More trivia topics' : 'Trivia questions by topic'}</h2>
        <div>
          {!topic ? null : <a href="/trivia-questions">All trivia questions</a>}
          {topics.filter((t) => !topic || t.slug !== topic.slug).map((t) => <a key={t.slug} href={`/trivia-questions/${t.slug}`}>{t.label} trivia <b>{fmt(t.n)}</b></a>)}
          <a href="/trivia">Today&apos;s Trivia Gauntlet</a>
        </div>
      </nav>

      {faq.length ? (
        <section className="tp-faq" aria-label="Questions">
          {faq.map((f) => <div className="tp-qa" key={f.q}><h2>{f.q}</h2><p>{f.a}</p></div>)}
        </section>
      ) : null}

      {game ? <Player key={game.key + game.qs[0].k} game={game} onAnswer={onAnswer} onDone={onDone} onExit={() => setGame(null)} onAgain={() => start(game.slug, { mode: game.mode, lanes: game.lanes, title: game.title, ids: game.retry ? store.m.slice(0, 25) : undefined })} /> : null}
    </CircuitFrame>
  );
}

// ---- one game, on the gauntlet stage ----
function Player({ game, onAnswer, onDone, onExit, onAgain }) {
  const { qs, mode } = game;
  const timed = mode === 'gauntlet' || mode === 'streak';
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [lock, setLock] = useState(null);    // right answer lit after a hit
  const [miss, setMiss] = useState(null);    // { pick } while the spotlight holds
  const [over, setOver] = useState(null);    // { why }
  const [now, setNow] = useState(() => Date.now());
  const qStart = useRef(Date.now());
  const sprintEnd = useRef(mode === 'sprint' ? Date.now() + SPRINT_SECONDS * 1000 : 0);
  const busy = lock != null || miss != null || !!over;
  const q = qs[i];

  useEffect(() => {
    if (over) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(iv);
  }, [over]);
  const finish = useCallback((why, score) => { setOver({ why, score }); onDone(game.key, score); }, [game.key, onDone]);
  const next = useCallback((score) => {
    if (i + 1 >= qs.length) { finish('all', score); return; }
    // The next question's clock starts now, set before the render that shows it
    // so a stale clock can never read zero and time it out.
    qStart.current = Date.now();
    setNow(qStart.current);
    setI(i + 1);
  }, [i, qs.length, finish]);

  const answer = useCallback((k) => {
    if (busy || !q) return;
    const ok = k === q.a;
    onAnswer(q, ok);
    if (ok) {
      const sc = right + 1;
      setRight(sc);
      setLock(q.a);
      setTimeout(() => { setLock(null); next(sc); }, 650);
      return;
    }
    setMiss({ pick: k });
    const hold = mode === 'sprint' ? 900 : MISS_MS + (mode === 'practice' ? 600 : 0);
    setTimeout(() => {
      setMiss(null);
      if (mode === 'gauntlet' || mode === 'streak') finish('miss', right);
      else next(right);
    }, hold);
  }, [busy, q, right, mode, next, finish, onAnswer]);

  // The clocks.
  const qLeft = timed ? Math.max(0, Q_SECONDS * 1000 - (now - qStart.current)) : null;
  const sLeft = mode === 'sprint' ? Math.max(0, sprintEnd.current - now) : null;
  useEffect(() => {
    if (busy) return;
    if (timed && qLeft === 0) answer(-1);
    if (mode === 'sprint' && sLeft === 0) finish('time', right);
  }, [qLeft, sLeft, busy, timed, mode, answer, finish, right]);

  // Keys 1 to 4, and Escape to leave.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onExit(); return; }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) answer(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, onExit]);
  useEffect(() => { const o = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = o; }; }, []);

  if (over) {
    const sc = over.score;
    const line = mode === 'sprint' ? `${sc} right in 60 seconds` : mode === 'streak' ? `A streak of ${sc}` : `${sc} of ${qs.length} right`;
    const sub = over.why === 'miss' ? (mode === 'streak' ? 'The streak ended on a miss.' : `The gauntlet ended on question ${i + 1}.`) : over.why === 'time' ? 'The clock ran out.' : 'You answered every question.';
    return (
      <div className="tp-end" role="dialog" aria-label="Game over" style={{ background: softGround(game.color), color: RAMP_INK }}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="tp-endin">
          <span className="tp-tk">{game.title} · {MODES.find((m) => m.key === mode).label}</span>
          <h2>{line}</h2>
          <p>{sub} Nothing here counts toward your Mind Loft points; your best stays in this browser.</p>
          <div className="tp-endb">
            <button type="button" className="tp-endp" onClick={onAgain}>Play again</button>
            <button type="button" onClick={onExit}>Change topic or mode</button>
            <a href="/trivia">Play today&apos;s Trivia Gauntlet</a>
          </div>
        </div>
      </div>
    );
  }
  if (!q) return null;
  const frac = mode === 'sprint' ? sLeft / (SPRINT_SECONDS * 1000) : timed ? qLeft / (Q_SECONDS * 1000) : null;
  const count = mode === 'sprint' ? `${right} right · ${Math.ceil(sLeft / 1000)}s` : mode === 'streak' ? `Streak ${right}` : `Question ${i + 1} of ${qs.length} · ${right} right`;
  return (
    <GauntletStage
      bg={game.color}
      qKey={`${i}-${q.k}`}
      label={count}
      kicker={q.lane}
      question={<h2>{q.q}</h2>}
      choices={q.c}
      onPick={answer}
      lockIdx={lock}
      missRight={miss ? q.a : null}
      missPick={miss && miss.pick >= 0 ? miss.pick : null}
      disabled={busy}
      frac={frac}
      hot={frac != null && frac < 0.25}
      footer={<>{count} · <button type="button" className="tp-leave" onClick={onExit}>Leave</button></>}
    />
  );
}

// No backticks or apostrophes inside (CircuitFrame escaping trap).
const CSS = `
:root{--tp-hue:${HUE};--tp-ink:#0b0d12;}
.tp-crumb{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12.5px;font-weight:700;color:var(--stg-mute);margin-bottom:12px;}
.tp-crumb a{color:var(--stg-ink2);text-decoration:none;}
.tp-crumb a:hover{color:var(--stg-ink);text-decoration:underline;}
.tp-crumb span[aria-current]{color:var(--stg-ink);}
.tp-head{display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:8px;}
.tp-htx{flex:1 1 440px;min-width:0;}
.tp-head h1{margin:0;font-size:34px;line-height:1.15;font-weight:800;letter-spacing:-0.02em;color:var(--stg-ink);}
.tp-lede{margin:8px 0 0;max-width:700px;font-size:15px;line-height:1.55;font-weight:600;color:var(--stg-ink2);}
.tp-today{display:flex;gap:12px;flex-wrap:wrap;}
.tp-tc{display:flex;flex-direction:column;gap:3px;width:250px;padding:12px 14px;border:1px solid var(--stg-ink);border-radius:12px;background:var(--stg-surf);color:var(--stg-ink);text-decoration:none;box-sizing:border-box;}
.tp-tc.big{background:var(--tp-hue);color:var(--tp-ink);border-color:var(--tp-ink);}
.tp-tc b{font-size:17px;font-weight:800;line-height:1.3;}
.tp-tc small{font-size:12.5px;font-weight:600;line-height:1.45;opacity:.85;}
.tp-tc:hover{filter:brightness(1.04);}
.tp-tk{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.8;}
.tp-sh{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:30px 0 12px;}
.tp-sh.tight{margin:0 0 10px;}
.tp-sh h2{margin:0;font-size:21px;font-weight:800;letter-spacing:-0.01em;color:var(--stg-ink);}
.tp-sh p{margin:0;font-size:14px;font-weight:600;color:var(--stg-mute);}
.tp-link{font:inherit;font-weight:800;color:var(--stg-ink);background:none;border:0;padding:0;text-decoration:underline;cursor:pointer;}
.tp-ctl{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:12px 14px;margin-bottom:16px;background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:14px;}
.tp-grp{display:flex;align-items:center;gap:10px;}
.tp-lab{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--stg-mute);}
.tp-seg{display:flex;border:1px solid var(--stg-ink);border-radius:10px;overflow:hidden;background:var(--stg-surf);}
.tp-seg button{font:inherit;font-size:14px;font-weight:800;padding:0 14px;min-height:44px;border:0;border-right:1px solid var(--stg-ink);border-radius:0;background:transparent;color:var(--stg-ink);cursor:pointer;line-height:1.2;}
.tp-seg button:last-child{border-right:0;}
.tp-seg button small{display:block;font-size:10.5px;font-weight:700;color:var(--stg-mute);}
.tp-seg button.on{background:var(--tp-hue);color:var(--tp-ink);}
.tp-seg button.on small{color:var(--tp-ink);opacity:.75;}
.tp-seg.sm button{font-size:13px;min-height:40px;padding:0 11px;}
.tp-modenote{margin:0;font-size:13.5px;font-weight:600;color:var(--stg-ink2);max-width:420px;line-height:1.45;}
.tp-err{margin:0 0 12px;font-size:14px;font-weight:700;color:var(--stg-bad,#c0392b);}
.tp-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;}
.tp-tile{display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid var(--stg-ink);border-radius:14px;background:var(--stg-surf);}
.tp-th{display:flex;align-items:center;gap:10px;}
.tp-ic{flex:none;width:40px;height:40px;border-radius:10px;background:var(--tc);color:var(--tp-ink);border:1px solid var(--tp-ink);display:flex;align-items:center;justify-content:center;}
.tp-tile h3{margin:0;font-size:16.5px;font-weight:800;line-height:1.3;}
.tp-tile h3 a{color:var(--stg-ink);text-decoration:none;}
.tp-tile h3 a:hover{text-decoration:underline;}
.tp-cnt{font-size:12.5px;font-weight:700;color:var(--stg-mute);}
.tp-lanes{margin:0;font-size:12.5px;line-height:1.5;font-weight:600;color:var(--stg-ink2);}
.tp-prog{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--stg-ink2);margin-top:auto;}
.tp-track{flex:1;height:8px;border-radius:999px;background:var(--stg-surf2);overflow:hidden;border:1px solid var(--stg-line);}
.tp-track span{display:block;height:100%;background:var(--tp-hue);}
.tp-tf{display:flex;gap:8px;}
.tp-go{flex:1;display:inline-flex;align-items:center;justify-content:center;font:inherit;font-size:14px;font-weight:800;min-height:44px;padding:0 14px;border-radius:10px;border:1px solid var(--stg-ink);background:var(--stg-ink);color:var(--stg-ground);text-decoration:none;cursor:pointer;}
.tp-go.lt{background:transparent;color:var(--stg-ink);}
.tp-go:disabled{opacity:.45;cursor:default;}
.tp-go.big{width:100%;min-height:54px;font-size:16px;margin-top:4px;}
.tp-mine{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;}
.tp-mc{display:flex;flex-direction:column;gap:6px;padding:16px;border:1px solid var(--stg-ink);border-radius:14px;background:var(--stg-surf);color:var(--stg-ink);}
.tp-mc b{font-size:16.5px;font-weight:800;line-height:1.35;}
.tp-mc > span:not(.tp-tk){font-size:13.5px;line-height:1.5;font-weight:600;color:var(--stg-ink2);}
.tp-mc .tp-go{flex:none;align-self:flex-start;margin-top:auto;}
.tp-two{display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:26px;align-items:start;margin-top:20px;}
.tp-setup{position:sticky;top:12px;display:flex;flex-direction:column;gap:12px;padding:16px;border:1px solid var(--stg-ink);border-radius:14px;background:var(--stg-surf);}
.tp-setup .tp-ctl{flex-direction:column;align-items:stretch;padding:0;margin:0;border:0;background:none;}
.tp-setup .tp-grp{flex-direction:column;align-items:stretch;gap:6px;}
.tp-setup .tp-seg button{flex:1;padding:0 4px;}
.tp-best{display:flex;flex-direction:column;gap:4px;font-size:13.5px;font-weight:600;color:var(--stg-ink2);}
.tp-lanelist{display:flex;flex-direction:column;gap:8px;}
.tp-lanelist.many{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));max-height:520px;overflow:auto;padding-right:4px;}
.tp-ln{display:flex;align-items:center;gap:12px;padding:11px 14px;border:1px solid var(--stg-line);border-radius:12px;background:var(--stg-surf);cursor:pointer;}
.tp-ln.on{border-color:var(--stg-ink);box-shadow:inset 0 0 0 1px var(--stg-ink);}
.tp-ln input{flex:none;width:20px;height:20px;accent-color:var(--stg-ink);}
.tp-lnt{display:flex;flex-direction:column;gap:1px;min-width:0;}
.tp-lnt b{font-size:15px;font-weight:800;color:var(--stg-ink);}
.tp-lnt span{font-size:12.5px;font-weight:600;color:var(--stg-mute);}
.tp-search{display:block;margin-bottom:10px;}
.tp-search input{width:100%;box-sizing:border-box;height:42px;padding:0 12px;border:1px solid var(--stg-line);border-radius:10px;background:var(--stg-surf);font:inherit;font-size:14px;font-weight:600;color:var(--stg-ink);}
.tp-samples{margin-top:34px;max-width:860px;}
.tp-samples h2{margin:0 0 10px;font-size:20px;font-weight:800;color:var(--stg-ink);}
.tp-samples details{border-top:1px solid var(--stg-line);padding:12px 0;}
.tp-samples summary{font-size:15px;font-weight:800;line-height:1.45;color:var(--stg-ink);cursor:pointer;}
.tp-samples details p{margin:8px 0 0;font-size:14px;line-height:1.55;font-weight:600;color:var(--stg-ink2);}
.tp-samples details p b{color:var(--stg-ink);}
.tp-note{margin:14px 0 0;font-size:13px;font-weight:600;color:var(--stg-mute);line-height:1.5;}
.tp-more{margin-top:38px;padding-top:22px;border-top:1px solid var(--stg-line);}
.tp-more h2{margin:0 0 10px;font-size:18px;font-weight:800;color:var(--stg-ink);}
.tp-more div{display:flex;flex-wrap:wrap;gap:8px;}
.tp-more a{font-size:13px;font-weight:800;padding:9px 13px;border-radius:999px;background:var(--stg-surf);color:var(--stg-ink2);border:1px solid var(--stg-line);text-decoration:none;}
.tp-more a:hover{border-color:var(--stg-ink);color:var(--stg-ink);}
.tp-more a b{font-weight:800;color:var(--stg-mute);margin-left:3px;}
.tp-faq{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:26px;}
.tp-qa{padding:16px 18px;border-radius:12px;background:var(--stg-surf);border:1px solid var(--stg-line);}
.tp-qa h2{margin:0;font-size:16px;line-height:1.35;font-weight:800;color:var(--stg-ink);}
.tp-qa p{margin:6px 0 0;font-size:14px;line-height:1.5;font-weight:600;color:var(--stg-ink2);}
.tp-leave{font:inherit;color:inherit;background:none;border:0;padding:0;text-decoration:underline;cursor:pointer;font-weight:800;}
.tp-end{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto;font-family:Manrope,system-ui,sans-serif;}
.tp-endin{max-width:520px;width:100%;text-align:center;}
.tp-end h2{margin:10px 0 10px;font-size:clamp(30px,6vw,44px);line-height:1.15;font-weight:800;}
.tp-end p{margin:0 0 22px;font-size:16px;line-height:1.5;font-weight:600;}
.tp-endb{display:flex;flex-direction:column;gap:10px;}
.tp-endb button,.tp-endb a{display:block;width:100%;box-sizing:border-box;font:inherit;font-size:16px;font-weight:800;padding:14px;border-radius:12px;border:1px solid currentColor;background:transparent;color:inherit;text-decoration:none;cursor:pointer;}
.tp-endb .tp-endp{background:#08222e;color:#ffffff;border-color:#08222e;}
@media (max-width:1150px){.tp-grid{grid-template-columns:repeat(3,minmax(0,1fr));}}
@media (max-width:900px){.tp-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.tp-mine,.tp-faq{grid-template-columns:minmax(0,1fr);}.tp-two{grid-template-columns:minmax(0,1fr);}.tp-setup{position:static;order:-1;}}
@media (max-width:640px){
  .tp-head h1{font-size:26px;}
  .tp-lede{font-size:14px;}
  .tp-today{width:100%;}
  .tp-tc{flex:1 1 0;width:auto;min-width:0;}
  .tp-tc small{display:none;}
  .tp-ctl{gap:10px;padding:10px;}
  .tp-grp{width:100%;flex-direction:column;align-items:stretch;gap:6px;}
  .tp-seg button{flex:1;padding:0 4px;font-size:13px;}
  .tp-seg button small{display:none;}
  .tp-seg.sm button{font-size:12px;min-width:0;padding:0 2px;}
  .tp-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
  .tp-tile{padding:11px;gap:8px;}
  .tp-tile h3{font-size:14px;}
  .tp-ic{width:32px;height:32px;}
  .tp-lanes{display:none;}
  .tp-prog > span:last-child{display:none;}
  .tp-tf{flex-direction:column;}
  .tp-tf .tp-go{min-height:40px;font-size:13px;}
  .tp-lanelist.many{grid-template-columns:minmax(0,1fr);}
}
`;
