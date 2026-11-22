'use client';

// THE QUESTION DATABASES' PAGES (owner, 2026-11-21). One client for the hub and
// every topic page of the Trivia Database (/trivia-questions), the Math
// Database (/math-questions) and the English Database (/english-questions).
// Config and rulings: lib/qdb.js. Questions: lib/qdb-library.js (server only),
// served one set at a time by /api/trivia/set.
//
// THE PAGE IS A GAUNTLET STAGE (owner: "ideally trivia ends up looking like the
// gauntlet play pages"; design: the "Trivia Portal Mockup (gauntlet stage
// look)" canvas). A pastel ground and one dark ink, a tag pill, one big
// question in the stage's type, and the topics (or a topic's lanes) as answer
// tiles. The stage's own look switch (Color, Plain, Dark ...) applies here as it
// does on every gauntlet, and a game plays on the real GauntletStage.
//
// Three modes, a Difficulty and a length:
//   Practice  no clock, no lives; a miss shows the answer and play goes on
//   Gauntlet  the clock on every question, one miss ends it; Endless runs until then
//   Sprint    as many as you can in 60 seconds; a miss costs time, not the game
// The record (seen, right, bests, missed questions) is this browser's (lib/qdb.js
// storeKey). TRACKING (owner, 2026-11-21): each page posts a view (qdb-<db>,
// qdb-<db>-<topic>), and each finished game posts a result row under
// qdb-<db>-<topic or mix> so it counts in the admin's Quiz Plays. quiz-xp skips
// qdb- ids: no IQ Points, and nothing ranks on it.
//
// SERVER HTML IS THE CRAWL PATH: topic tiles are real links to their pages, and
// the sample questions print with their answers in the page.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GauntletStage, { MISS_MS } from './GauntletStage';
import StageTopBar from './StageTopBar';
import StageFooter from './StageFooter';
import PageViewBeacon from './PageViewBeacon';
import { dailyMeIdentity } from './dailyMeClient';
import { useGauntletLook, stagePalette, useStageChrome } from './GauntletScreens';
import { nextLook } from '@/lib/stage-look';
import { softGround, RAMP_INK } from '@/lib/category-ramp';
import { mathText } from './MathText';
import { QDBS, QDB_KEYS, MODES, DIFFICULTY, COUNTS, ENDLESS_N, SPRINT_SECONDS, storeKey, setupKey, MISS_CAP, laneLabel } from '@/lib/qdb';

const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const pct = (a) => (a && a[0] ? Math.round((a[1] / a[0]) * 100) : 0);
// Lane names keep the banks' ampersands as keys; readers get "and", with the
// Oxford comma where a list has three (site style, 2026-11-18).
export { laneLabel };
const LEGACY_LEVEL = { 1: 'g', 2: 'g', 3: 'm', 4: 't', 5: 't' };
const DIFF_KEYS = DIFFICULTY.map(([k]) => k);
const SEEN_CAP = 4000;

function readStore(db) {
  try { const s = JSON.parse(localStorage.getItem(storeKey(db)) || 'null'); if (s && typeof s === 'object') return { t: s.t || {}, l: s.l || {}, b: s.b || {}, m: Array.isArray(s.m) ? s.m : [], s: Array.isArray(s.s) ? s.s : [] }; } catch (e) {}
  return { t: {}, l: {}, b: {}, m: [], s: [] };
}
function writeStore(db, s) { try { localStorage.setItem(storeKey(db), JSON.stringify(s)); } catch (e) {} }
// A saved setup from the first day (four modes, five levels) maps onto today's.
function cleanSetup(s) {
  const out = { mode: 'practice', level: 'ramp', n: 10 };
  if (!s || typeof s !== 'object') return out;
  if (s.mode === 'streak') { out.mode = 'gauntlet'; out.n = 0; }
  else if (MODES.some((m) => m.key === s.mode)) out.mode = s.mode;
  if (DIFF_KEYS.includes(s.level)) out.level = s.level;
  else if (LEGACY_LEVEL[s.level]) out.level = LEGACY_LEVEL[s.level];
  if (s.mode !== 'streak' && COUNTS.includes(s.n)) out.n = s.n;
  if (out.n === 0 && out.mode !== 'gauntlet') out.n = 10;
  return out;
}

export default function QdbPortal({ db: dbKey = 'trivia', topics, topic = null, lane = null, laneLinks = [], samples = [], showcase = [], faq = [], total = 0, crumbs = [] }) {
  const db = QDBS[dbKey];
  const [look, setLook] = useGauntletLook();
  const ground = topic ? topic.color : db.ground;
  const pal = stagePalette(ground, look);
  useStageChrome(pal.bg);
  const dark = look === 'dark' || look === 'darktint';
  const tileFor = (c) => (look === 'color' || look === 'tint' ? softGround(c) : look === 'darktint' ? `color-mix(in srgb, ${softGround(c)} 34%, ${pal.bg})` : null);

  const [setup, setSetup] = useState({ mode: 'practice', level: 'ramp', n: 10 });
  const [store, setStore] = useState({ t: {}, l: {}, b: {}, m: [], s: [] });
  const [sheet, setSheet] = useState(false);
  // A subtopic page (lane: { name, n, h1, blurb }) opens with its own lane picked.
  const [lanes, setLanes] = useState(() => new Set(lane ? [lane.name] : []));
  const [hydrated, setHydrated] = useState(false);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [laneQ, setLaneQ] = useState('');
  // Topics picked on a hub (owner, 2026-11-21: "a way to select multiple topics").
  const [picked, setPicked] = useState(() => new Set());
  // BROWSER BACK CLOSES A GAME FIRST (owner, 2026-11-21: Back from a game "takes
  // you all the way back home instead of database first page"). A game opens in
  // place, so starting one adds a history step; Back (or Leave) pops it and lands
  // on the topic picker with the picks kept. Only a step this page pushed is
  // popped, so Leave after a reload never steps off the site.
  const gameStep = useRef(false);
  useEffect(() => {
    if (!game || gameStep.current) return;
    try { window.history.pushState({ qdbGame: 1 }, '', window.location.href); gameStep.current = true; } catch (e) {}
  }, [game]);
  useEffect(() => {
    const onPop = () => { if (gameStep.current) { gameStep.current = false; setGame(null); } };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const leaveGame = useCallback(() => {
    if (gameStep.current) { try { window.history.back(); return; } catch (e) {} }
    setGame(null);
  }, []);

  useEffect(() => {
    try { setSetup(cleanSetup(JSON.parse(localStorage.getItem(setupKey(dbKey)) || 'null'))); } catch (e) {}
    setStore(readStore(dbKey));
    setHydrated(true);
  }, [dbKey]);
  const pick = (k, v) => setSetup((s) => {
    const n2 = { ...s, [k]: v };
    if (k === 'mode' && v !== 'gauntlet' && n2.n === 0) n2.n = 10;
    try { localStorage.setItem(setupKey(dbKey), JSON.stringify(n2)); } catch (e) {}
    return n2;
  });

  const start = useCallback(async (slug, opts = {}) => {
    const t = slug === 'mix' ? { slug: 'mix', label: db.mix, color: db.ground } : topics.find((x) => x.slug === slug);
    if (!t) return;
    const mode = opts.mode || setup.mode;
    const n = mode === 'sprint' || (mode === 'gauntlet' && setup.n === 0 && !opts.mode) ? ENDLESS_N : (opts.n || setup.n || 10);
    const endless = mode === 'gauntlet' && n === ENDLESS_N;
    setLoading(true); setErr('');
    try {
      // A retry is a GET by keys; a new set is a POST that carries this browser's
      // seen keys, so the deal is oldest first and never straight back to them.
      const r = opts.ids
        ? await fetch(`/api/trivia/set?db=${dbKey}&ids=${encodeURIComponent(opts.ids.join(','))}`)
        : await fetch('/api/trivia/set', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ db: dbKey, t: slug, ts: opts.topics || [], l: opts.lanes || [], lv: endless || mode === 'sprint' ? 'ramp' : setup.level, n, s: Math.floor(Math.random() * 1000), seen: (readStore(dbKey).s || []).slice(0, SEEN_CAP) }) });
      const d = await r.json();
      if (!d || !Array.isArray(d.qs) || !d.qs.length) throw new Error('empty');
      setGame({ qs: d.qs, mode, endless, title: opts.title || t.label, color: t.color, slug, key: `${slug}|${mode}|${mode === 'sprint' || endless ? 0 : n}`, lanes: opts.lanes || [], retry: !!opts.ids, level: setup.level });
    } catch (e) {
      setErr(`Those ${db.many} could not be loaded. Try again in a moment.`);
    }
    setLoading(false);
  }, [setup, topics, db, dbKey]);

  const onAnswer = useCallback((q, right) => {
    setStore((s0) => {
      // Every answered key joins `s` (newest first, SEEN_CAP): the server deals those last.
      const s = { t: { ...s0.t }, l: { ...s0.l }, b: s0.b, m: s0.m, s: [q.k, ...(s0.s || []).filter((k) => k !== q.k)].slice(0, SEEN_CAP) };
      const tk = q.t || (topic && topic.slug) || 'mix';
      const a = s.t[tk] || [0, 0]; s.t[tk] = [a[0] + 1, a[1] + (right ? 1 : 0)];
      const lk = `${tk}|${q.lane}`; const b = s.l[lk] || [0, 0]; s.l[lk] = [b[0] + 1, b[1] + (right ? 1 : 0)];
      s.m = right ? s0.m.filter((k) => k !== q.k) : [q.k, ...s0.m.filter((k) => k !== q.k)].slice(0, MISS_CAP);
      writeStore(dbKey, s);
      return s;
    });
  }, [topic, dbKey]);
  const onDone = useCallback((key, score) => {
    setStore((s0) => {
      if ((s0.b[key] || 0) >= score) return s0;
      const s = { ...s0, b: { ...s0.b, [key]: score } };
      writeStore(dbKey, s);
      return s;
    });
  }, [dbKey]);

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

  const diffName = (DIFFICULTY.find(([k]) => k === setup.level) || DIFFICULTY[0])[1];
  const endlessOn = setup.mode === 'gauntlet' && setup.n === 0;
  const lengthLine = setup.mode === 'sprint' ? '60 seconds' : endlessOn ? 'Endless, until you miss' : `${setup.n} ${db.many}`;
  const diffLine = setup.mode === 'sprint' || endlessOn ? 'gentle to tough' : setup.level === 'ramp' ? 'Mixed, gentle to tough' : diffName;
  const modeName = MODES.find((m) => m.key === setup.mode).label;

  const seg = (label, id, items, cur, onPick, disabledFor = () => false) => (
    <div className="qd-grp">
      <span className="qd-lab" id={id}>{label}</span>
      <div className="qd-seg" role="group" aria-labelledby={id}>
        {items.map(([k, lab]) => (
          <button key={String(k)} type="button" className={cur === k ? 'on' : ''} aria-pressed={cur === k} disabled={disabledFor(k)} onClick={() => onPick(k)}>{lab}</button>
        ))}
      </div>
    </div>
  );
  const controls = (
    <div className="qd-setup" aria-label="Game settings">
      {seg('Play It As', 'qd-lm', MODES.map((m) => [m.key, m.label]), setup.mode, (k) => pick('mode', k))}
      {setup.mode !== 'sprint' && !endlessOn ? seg('Difficulty', 'qd-ld', DIFFICULTY, setup.level, (k) => pick('level', k)) : null}
      {setup.mode !== 'sprint' ? seg(db.many.charAt(0).toUpperCase() + db.many.slice(1), 'qd-ln',
        COUNTS.filter((c) => c || setup.mode === 'gauntlet').map((c) => [c, c ? String(c) : 'Endless']), setup.n, (k) => pick('n', k)) : null}
      <p className="qd-note">{MODES.find((m) => m.key === setup.mode).sub}.{setup.mode === 'sprint' ? ' A miss costs time, not the game.' : endlessOn ? ' No finish line: it climbs from gentle to tough until you miss.' : ''}</p>
    </div>
  );

  // THE ONE-LINE SETTINGS (owner, 2026-11-21: "condense these to a single line by
  // making them drop down selections"). The page shows three dropdown pills in one
  // row; the start bar's Change sheet keeps the full toggles.
  const drop = (label, value, onPick, items, disabled = false) => (
    <label className={`qd-dd${disabled ? ' off' : ''}`}>
      <span className="qd-sr">{label}</span>
      <select value={String(value)} disabled={disabled} onChange={(e) => onPick(e.target.value)}>
        {items.map(([k, lab]) => <option key={String(k)} value={String(k)}>{lab}</option>)}
      </select>
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </label>
  );
  const Many = db.many.charAt(0).toUpperCase() + db.many.slice(1);
  const dropdowns = (
    <div className="qd-drops" aria-label="Game settings">
      {drop('Play it as', setup.mode, (v) => pick('mode', v), MODES.map((m) => [m.key, m.label]))}
      {setup.mode === 'sprint' || endlessOn
        ? drop('Difficulty', 'climb', () => {}, [['climb', 'Climbs']], true)
        : drop('Difficulty', setup.level, (v) => pick('level', v), DIFFICULTY)}
      {setup.mode === 'sprint'
        ? drop(Many, 'sprint', () => {}, [['sprint', '60 Sec']], true)
        : drop(Many, setup.n, (v) => pick('n', Number(v)), COUNTS.filter((c) => c || setup.mode === 'gauntlet').map((c) => [c, c ? `${c} Qs` : 'Endless']))}
    </div>
  );

  // What Start plays on a hub: every topic, the one picked, or the picked few mixed.
  const hubStart = () => {
    const ps = topics.filter((t) => picked.has(t.slug)).map((t) => t.slug);
    if (ps.length === 1) return start(ps[0]);
    if (ps.length > 1) return start('mix', { topics: ps, title: `${ps.length} Topics, Mixed` });
    return start('mix');
  };
  const hubName = picked.size === 1 ? (topics.find((t) => picked.has(t.slug)) || {}).label : picked.size > 1 ? `${picked.size} Topics, Mixed` : `${db.mix}: All ${topics.length} Topics`;
  const others = QDB_KEYS.filter((k) => k !== dbKey).map((k) => QDBS[k]);
  const showLanes = topic ? topic.lanes.filter(([l]) => !laneQ || l.toLowerCase().includes(laneQ.toLowerCase())) : [];
  const manyLanes = topic && topic.lanes.length > 12;

  return (
    <div className={`qd${dark ? ' dk' : ''}`} style={{ '--qd-bg': pal.bg, '--qd-ink': pal.ink, '--qd-tile': pal.tile || `color-mix(in srgb, ${pal.ink} 8%, transparent)` }}>
      <PageViewBeacon id={topic ? `qdb-${dbKey}-${topic.slug}` : `qdb-${dbKey}`} />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="qd-top"><StageTopBar look={look} onFlip={() => setLook(nextLook(look))} ink={pal.ink} href={topic ? db.base : '/'} allLooks share /></div>
      <main className="qd-col">
        {/* No breadcrumb row (owner, 2026-11-21: "get rid of the text above"); the BreadcrumbList data stays in the page head (QdbPages.jsx). */}
        {!topic ? (
          <>
            <h1 className="qd-kick">{db.name} · {fmt(total)} {db.many}</h1>
            <p className="qd-q">Choose your topic(s):</p>
            {dropdowns}
            <ul className="qd-grid">
              {topics.map((t, i) => {
                const me = hydrated ? store.t[t.slug] : null;
                const bg = tileFor(t.color);
                return (
                  <li key={t.slug}>
                    {/* A tap picks the topic for Start (several mix); its Subtopics link opens the
                        topic's own page, which stays the crawl path to it. */}
                    <div className={`qd-tile qd-pick${picked.has(t.slug) ? ' ok' : ''}`} style={bg && !picked.has(t.slug) ? { background: bg, '--qd-tink': look === 'darktint' ? pal.ink : RAMP_INK } : null}>
                      <button type="button" className="qd-pbtn" aria-pressed={picked.has(t.slug)}
                        onClick={() => setPicked((s0) => { const n2 = new Set(s0); if (n2.has(t.slug)) n2.delete(t.slug); else n2.add(t.slug); return n2; })}>
                        <span className="qd-num">{picked.has(t.slug) ? '✓' : String(i + 1).padStart(2, '0')}</span>
                        <span className="qd-tname">{t.label}</span>
                        <span className="qd-tsub">{fmt(t.n)} {db.many}{me && me[0] ? ` · ${pct(me)}% right` : ''}</span>
                      </button>
                      <a className="qd-parts" href={`${db.base}/${t.slug}`} aria-label={`${t.label}: pick its subtopics`}>Subtopics</a>
                    </div>
                  </li>
                );
              })}
            </ul>
            {err ? <p className="qd-err" role="alert">{err}</p> : null}
            <div className="qd-mine">
              <button type="button" className="qd-tile sm" disabled={!store.m.length || loading} onClick={() => start('mix', { mode: 'practice', n: 25, ids: store.m.slice(0, 25), title: 'Your missed ' + db.many })}>
                <span className="qd-tname">Retry My Misses</span>
                <span className="qd-tsub">{hydrated && store.m.length ? `${fmt(store.m.length)} saved from your games` : 'Every miss comes back here'}</span>
              </button>
              <button type="button" className="qd-tile sm" disabled={!weak || loading} onClick={() => weak && start(weak.slug, { mode: 'practice', lanes: [weak.lane], title: `${weak.label}: ${laneLabel(weak.lane)}` })}>
                <span className="qd-tname">{weak ? `Your Weak Spot: ${laneLabel(weak.lane)}` : 'Your Weak Spot'}</span>
                <span className="qd-tsub">{weak ? `You get ${weak.p} percent right. Practice it.` : 'Shows up after a dozen answers in one lane'}</span>
              </button>
              {db.today.map((d) => (
                <a key={d.href} className="qd-tile sm" href={d.href}>
                  <span className="qd-tname">Today&apos;s {d.name}</span>
                  <span className="qd-tsub">{d.sub}</span>
                </a>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="qd-kick">{lane ? `${topic.label}: ${laneLabel(lane.name)} · ${fmt(lane.n)}` : `${topic.label} · ${fmt(topic.n)}`} {db.many}</h1>
            <p className="qd-q">{manyLanes ? 'Choose your quiz(zes):' : 'Choose your part(s):'}</p>
            {dropdowns}
            {manyLanes ? (
              <label className="qd-search"><input type="search" value={laneQ} onChange={(e) => setLaneQ(e.target.value)} placeholder="Find a topic: Rome, volcanoes, jazz" aria-label="Find a quiz topic" /></label>
            ) : null}
            <div className={`qd-lanes${manyLanes ? ' many' : ''}`} role="group" aria-label="Lanes">
              {!laneQ ? (
                <button type="button" className={`qd-tile${lanes.size ? '' : ' ok'}`} aria-pressed={!lanes.size} onClick={() => setLanes(new Set())}>
                  <span className="qd-tname">All of {topic.label}</span>
                  <span className="qd-tsub">{fmt(topic.n)} {db.many}</span>
                </button>
              ) : null}
              {showLanes.map(([l, n]) => {
                const me = hydrated ? store.l[`${topic.slug}|${l}`] : null;
                const on = lanes.has(l);
                return (
                  <button key={l} type="button" className={`qd-tile${on ? ' ok' : ''}`} aria-pressed={on}
                    onClick={() => setLanes((s) => { const n2 = new Set(s); if (n2.has(l)) n2.delete(l); else n2.add(l); return n2; })}>
                    <span className="qd-tname">{laneLabel(l)}</span>
                    <span className="qd-tsub">{fmt(n)} {db.many}{me && me[0] ? ` · ${pct(me)}% right` : ''}</span>
                  </button>
                );
              })}
            </div>
            <p className="qd-hint">{manyLanes ? 'Pick one or more quizzes to mix, or play them all.' : 'Pick one part, or several to mix them. Then press Start below.'}</p>
            {err ? <p className="qd-err" role="alert">{err}</p> : null}
            <p className="qd-rec">
              {hydrated && store.t[topic.slug] ? `Your record here: ${fmt(store.t[topic.slug][0])} answered, ${pct(store.t[topic.slug])}% right.` : 'Your record stays in this browser.'}
              {hydrated ? MODES.map((m) => {
                const k = Object.keys(store.b).filter((x) => x.startsWith(`${topic.slug}|${m.key}|`));
                const v = k.length ? Math.max(...k.map((x) => store.b[x])) : 0;
                return v ? <span key={m.key}> {m.label} best: {v}{m.key === 'sprint' ? ' in 60 seconds' : ' right'}.</span> : null;
              }) : null}
              {topic.daily ? <> New ones every day in <a href={topic.daily.href}>{topic.daily.name}</a>.</> : null}
            </p>
          </>
        )}
      </main>

      <section className="qd-fold">
        <div className="qd-in">
          {!topic ? (
            <>
              <h2>Free {db.noun} and answers</h2>
              <p className="qd-lede">Every {db.one} here has already run in a Mind Loft daily, so nothing spoils a future board. Pick a topic, a difficulty, and a length, and play on the same full-screen stage as the daily gauntlets. No signup, no download.</p>
              {showcase.length ? (
                <div className="qd-mini">
                  {showcase.map((q) => {
                    const t = topics.find((x) => x.slug === q.t);
                    const bg = t ? (tileFor(t.color) || null) : null;
                    return (
                      <div key={q.k} className="qd-ms" style={bg ? { background: bg, '--qd-tink': look === 'darktint' ? pal.ink : RAMP_INK } : null}>
                        <span className="qd-pill">{t ? t.label : ''} · {laneLabel(q.lane)}</span>
                        <p className="qd-msq">{dbKey === 'math' ? mathText(q.q) : q.q}{q.p ? <span>{q.p}</span> : null}</p>
                        <div className="qd-msc">{q.c.map((c, i) => <span key={i} className={i === q.a ? 'ok' : ''}>{dbKey === 'math' ? mathText(c) : c}</span>)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : samples.length ? (
            <>
              {/* THE PRINTED QUESTIONS (2026-11-22): every question with its four choices,
                  the answer one tap away in a <details>, so a reader can quiz themselves and
                  a crawler still reads the answer in the page. */}
              <h2>{lane ? lane.h1 : topic.h1} with answers</h2>
              {lane ? <p className="qd-lede">{lane.blurb}</p> : null}
              <ol className="qd-qa">
                {samples.map((q) => (
                  <li key={q.k} className="qd-qr">
                    <span className="qd-ql">{lane ? q.band : laneLabel(q.lane)}</span>
                    <div>
                      <b>{dbKey === 'math' ? mathText(q.q) : q.q}{q.p ? ` (${q.p.toLowerCase()})` : ''}</b>
                      <ul className="qd-ch">{q.c.map((c, i) => <li key={i}><i>{'ABCD'[i] || i + 1}</i> {dbKey === 'math' ? mathText(c) : c}</li>)}</ul>
                      <details className="qd-rev"><summary>Show answer</summary><span className="qd-ans">Answer: {'ABCD'[q.a] || ''}{'ABCD'[q.a] ? ', ' : ''}{dbKey === 'math' ? mathText(q.c[q.a]) : q.c[q.a]}</span></details>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="qd-lede sm">Every {db.one} here has already run as a Mind Loft daily, so replaying it never spoils a future one. A few of these change every week. Press Start below to play {lane ? 'this subtopic' : 'the whole topic'} on the clock.</p>
              {laneLinks.length ? (
                <>
                  <h2 className="qd-subh">{lane ? `More ${topic.label} subtopics` : `${topic.label} subtopics`}</h2>
                  <nav className="qd-links" aria-label={`${topic.label} subtopics`}>
                    {lane ? <a href={`${db.base}/${topic.slug}`}>All of {topic.label}</a> : null}
                    {laneLinks.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
                  </nav>
                </>
              ) : null}
            </>
          ) : null}

          {faq.length ? (
            <div className="qd-faq">
              {faq.map((f) => <div key={f.q}><h2>{f.q}</h2><p>{f.a}</p></div>)}
            </div>
          ) : null}

          <nav className="qd-links" aria-label={`${db.name} topics`}>
            {topic ? <a href={db.base}>{db.name}</a> : null}
            {topics.filter((t) => !topic || t.slug !== topic.slug).map((t) => <a key={t.slug} href={`${db.base}/${t.slug}`}>{t.label} {db.many}</a>)}
            {db.today.map((d) => <a key={d.href} href={d.href}>Today&apos;s {d.name}</a>)}
            {others.map((o) => <a key={o.key} href={o.base}>{o.name}</a>)}
          </nav>
        </div>
      </section>
      {/* THE START BAR (owner, 2026-11-21, option B of the "Database Start Fix"
          canvas: "it is very hard to understand you have to scroll down to start").
          Pinned to the foot of the screen on every database page, so Start is never
          a scroll away: a Mixed Bag of every topic on a hub, of the whole topic on a
          topic page, or of whichever parts are picked. Change opens the settings. */}
      <div className="qd-bar" role="region" aria-label="Start a game">
        <div className="qd-bt">
          <b>{!topic ? hubName : !lanes.size ? `${topic.label} Mixed Bag` : lanes.size === 1 ? laneLabel([...lanes][0]) : `${lanes.size} ${manyLanes ? 'Quizzes' : 'Subtopics'} of ${topic.label}, Mixed`}</b>
          <small>{modeName} · {setup.mode === 'sprint' ? '60 seconds' : endlessOn ? 'Endless' : `${setup.n} ${db.many}`}{setup.mode === 'sprint' || endlessOn ? '' : ` · ${diffName}`} · <button type="button" className="qd-chg" onClick={() => setSheet(true)}>Change</button></small>
        </div>
        <button type="button" className="qd-bgo" disabled={loading} onClick={() => (topic ? start(topic.slug, { lanes: [...lanes], title: lanes.size === 1 ? `${topic.label}: ${laneLabel([...lanes][0])}` : topic.label }) : hubStart())}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>{loading ? 'Loading' : 'Start'}
        </button>
      </div>
      {sheet ? (
        <div className="qd-sheet" role="dialog" aria-modal="true" aria-label="Game settings" onClick={(e) => { if (e.target === e.currentTarget) setSheet(false); }}>
          <div className="qd-sin">
            <span className="qd-grab" aria-hidden="true" />
            <p className="qd-stitle">How do you want to play?</p>
            {controls}
            <div className="qd-srow">
              <button type="button" className="qd-tile sm" onClick={() => setSheet(false)}><span className="qd-tname">Done</span></button>
              <button type="button" className="qd-bgo" disabled={loading} onClick={() => { setSheet(false); if (topic) start(topic.slug, { lanes: [...lanes] }); else hubStart(); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>Start
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <StageFooter />

      {game ? <Player key={game.key + game.qs[0].k} db={db} dbKey={dbKey} game={game} onAnswer={onAnswer} onDone={onDone} onExit={leaveGame}
        onAgain={() => start(game.slug, { mode: game.mode, lanes: game.lanes, title: game.title, n: game.endless ? undefined : game.qs.length, ids: game.retry ? store.m.slice(0, 25) : undefined })} /> : null}
    </div>
  );
}

// ---- one game, on the gauntlet stage ----
function Player({ db, dbKey, game, onAnswer, onDone, onExit, onAgain }) {
  const { qs, mode } = game;
  const timed = mode === 'gauntlet';
  const Q_MS = db.qSeconds * 1000;
  const mt = (x) => (dbKey === 'math' ? mathText(x) : x);
  const [look] = useGauntletLook();
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [lock, setLock] = useState(null);
  const [miss, setMiss] = useState(null);
  const [over, setOver] = useState(null);
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
  const t0 = useRef(Date.now());
  const posted = useRef(false);
  const finish = useCallback((why, score) => {
    setOver({ why, score });
    onDone(game.key, score);
    // A QUIZ PLAY (owner, 2026-11-21): one result row per finished game.
    if (posted.current) return;
    posted.current = true;
    try {
      const who = dailyMeIdentity();
      const answered = why === 'all' ? qs.length : Math.max(1, i + 1);
      fetch('/api/quiz/result', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: `qdb-${dbKey}-${game.slug}`, score, total: answered, correct: score,
          timeElapsed: Math.max(0, Math.round((Date.now() - t0.current) / 1000)),
          anonId: who.anonId || null, email: who.email || null,
          referrer: typeof document !== 'undefined' ? document.referrer : null }) }).catch(() => {});
    } catch (e) {}
  }, [game.key, game.slug, onDone, dbKey, qs.length, i]);
  const next = useCallback((score) => {
    if (i + 1 >= qs.length) { finish('all', score); return; }
    // The next question's clock starts now, before the render that shows it,
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
      if (mode === 'gauntlet') finish('miss', right);
      else next(right);
    }, hold);
  }, [busy, q, right, mode, next, finish, onAnswer]);

  const qLeft = timed ? Math.max(0, Q_MS - (now - qStart.current)) : null;
  const sLeft = mode === 'sprint' ? Math.max(0, sprintEnd.current - now) : null;
  useEffect(() => {
    if (busy) return;
    if (timed && qLeft === 0) answer(-1);
    if (mode === 'sprint' && sLeft === 0) finish('time', right);
  }, [qLeft, sLeft, busy, timed, mode, answer, finish, right]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onExit(); return; }
      if (over) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) answer(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, onExit, over]);
  useEffect(() => { const o = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = o; }; }, []);

  const endPal = stagePalette(game.color, look);
  useStageChrome(over ? endPal.bg : null);

  if (over) {
    const sc = over.score;
    const big = mode === 'sprint' ? `${sc} right` : game.endless ? `${sc} in a row` : `${sc} of ${qs.length}`;
    const sub = over.why === 'miss' ? `The gauntlet ended on ${db.one} ${i + 1}.` : over.why === 'time' ? 'The clock ran out.' : 'That is the whole set.';
    const diff = mode === 'sprint' || game.endless ? 'Gentle to Tough' : (DIFFICULTY.find(([k]) => k === game.level) || DIFFICULTY[0])[1];
    return (
      <div className="qd-end" role="dialog" aria-label="Game over" style={{ '--qd-bg': endPal.bg, '--qd-ink': endPal.ink, '--qd-tile': endPal.tile || `color-mix(in srgb, ${endPal.ink} 8%, transparent)` }}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="qd-endin">
          <span className="qd-eye">{game.title} · {MODES.find((m) => m.key === mode).label} · {diff}</span>
          <span className="qd-score">{big}</span>
          <span className="qd-endsub">{sub} {game.retry ? '' : 'Your misses are saved to Retry My Misses.'} Nothing here counts toward your Mind Loft points.</span>
          <button type="button" className="qd-go" onClick={onAgain}>
            <span className="qd-gname">Play Again</span>
            <span className="qd-gsub">{game.title} · a new set</span>
            <span className="qd-play"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg><span>Start</span></span>
          </button>
          <div className="qd-endrow">
            <button type="button" className="qd-tile sm" onClick={onExit}><span className="qd-tname">Change Topic or Mode</span></button>
            {db.today.slice(0, 1).map((d) => <a key={d.href} className="qd-tile sm" href={d.href}><span className="qd-tname">Today&apos;s {d.name}</span></a>)}
          </div>
        </div>
      </div>
    );
  }
  if (!q) return null;
  const frac = mode === 'sprint' ? sLeft / (SPRINT_SECONDS * 1000) : timed ? qLeft / Q_MS : null;
  const count = mode === 'sprint' ? `${right} right · ${Math.ceil(sLeft / 1000)}s` : game.endless ? `In a row: ${right}` : `${db.one.charAt(0).toUpperCase() + db.one.slice(1)} ${i + 1} of ${qs.length} · ${right} right`;
  return (
    <GauntletStage
      bg={game.color}
      qKey={`${i}-${q.k}`}
      label={count}
      kicker={laneLabel(q.lane)}
      question={<h2>{mt(q.q)}{q.p ? <span className="gst-sub">{q.p}</span> : null}</h2>}
      choices={q.c.map(mt)}
      onPick={answer}
      lockIdx={lock}
      missRight={miss ? q.a : null}
      missPick={miss && miss.pick >= 0 ? miss.pick : null}
      disabled={busy}
      frac={frac}
      hot={frac != null && frac < 0.25}
      footer={<>{count} · <button type="button" className="qd-leave" onClick={onExit}>Leave</button></>}
    />
  );
}

// Plain CSS; no backticks inside.
const CSS = `
.qd{background:var(--qd-bg);color:var(--qd-ink);min-height:100vh;font-family:'Manrope',system-ui,sans-serif;}
.qd a,.qd button{color:inherit;}
.qd-top{padding:max(12px, var(--safe-top, 0px)) 14px 0;}
html.lc-on:not(.lc-focus) .qd-top{display:none;}
.qd-col{max-width:1080px;margin:0 auto;box-sizing:border-box;padding:26px 20px 10px;display:flex;flex-direction:column;align-items:stretch;gap:28px;}
.qd-crumb{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;font-size:12.5px;font-weight:700;opacity:.75;margin-bottom:-14px;}
.qd-crumb a{text-decoration:none;}
.qd-crumb a:hover{text-decoration:underline;}
.qd-kick{align-self:center;display:inline-flex;align-items:center;gap:8px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0;padding:6px 14px 6px 11px;border:1px solid var(--qd-ink);border-radius:999px;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;line-height:1.3;text-align:center;}
.qd-kick::before{content:'';flex:none;width:7px;height:7px;border-radius:50%;background:var(--qd-ink);}
.qd-q{margin:-6px 0 0;text-align:center;font-size:30px;line-height:1.15;font-weight:800;letter-spacing:-0.02em;padding-bottom:.06em;}
/* THE ODD-TILE RULE (owner, 2026-11-21): a short last row is centred at the same
   tile size, never left-hanging. Topic tiles wrap three to a row and centre the rest. */
/* Every tile is the same size (owner, 2026-11-21): a 6-track grid, each tile spans 2, rows all as tall as the tallest
   (grid-auto-rows:1fr). A short last row is centred by offsetting its first tile one track. */
.qd-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));grid-auto-rows:1fr;gap:14px;}
.qd-grid li{display:flex;grid-column:auto / span 2;min-width:0;}
.qd-grid > li:last-child:nth-child(3n+1),.qd-lanes:not(.many) > .qd-tile:last-child:nth-child(3n+1){grid-column:3 / span 2;}
.qd-grid > li:nth-last-child(2):nth-child(3n+1),.qd-lanes:not(.many) > .qd-tile:nth-last-child(2):nth-child(3n+1){grid-column:2 / span 2;}
.qd-tile{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:118px;width:100%;box-sizing:border-box;padding:16px 14px;border:1px solid var(--qd-ink);border-radius:18px;background:var(--qd-tile);color:var(--qd-tink, var(--qd-ink)) !important;font-family:inherit;text-align:center;text-decoration:none;cursor:pointer;transition:background .15s, transform .1s;}
.qd-tile *{color:var(--qd-tink, var(--qd-ink));}
.qd-tile:active{transform:scale(.99);}
@media(hover:hover){.qd-tile:hover{filter:brightness(.97);}}
.qd.dk .qd-tile:hover{filter:brightness(1.15);}
.qd-tile:disabled{cursor:default;opacity:.6;}
.qd-tile.ok{background:var(--qd-ink);border-color:var(--qd-ink);}
.qd-pick{padding:0;overflow:hidden;}
.qd-pbtn{flex:1;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:16px 14px 26px;border:0;background:transparent;font:inherit;text-align:center;cursor:pointer;color:inherit;}
.qd-parts{position:absolute;right:10px;bottom:8px;font-size:11.5px;font-weight:800;text-decoration:underline;text-underline-offset:2px;opacity:.75;}
.qd-parts:hover{opacity:1;}
.qd-tile.ok,.qd-tile.ok *{color:var(--qd-bg) !important;}
.qd-num{position:absolute;top:11px;left:13px;font-size:11.5px;font-weight:800;opacity:.55;}
.qd-tname{font-size:21px;font-weight:800;line-height:1.18;letter-spacing:-0.01em;padding-bottom:.06em;}
.qd-tsub{font-size:13px;font-weight:700;opacity:.75;line-height:1.35;}
.qd-tile.sm{min-height:84px;}
.qd-tile.sm .qd-tname{font-size:17px;}
.qd-lanes{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));grid-auto-rows:1fr;gap:14px;}
.qd-lanes > .qd-tile{grid-column:auto / span 2;min-width:0;}
.qd-lanes .qd-tile{min-height:104px;}
.qd-lanes.many{display:grid;justify-content:normal;max-height:520px;overflow-y:auto;padding:2px;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));grid-auto-rows:1fr;gap:10px;}
.qd-lanes.many > .qd-tile{flex:none;grid-column:auto;}
.qd-lanes.many .qd-tile{min-height:70px;padding:10px;}
.qd-lanes.many .qd-tname{font-size:16px;}
.qd-search{display:flex;justify-content:center;margin-bottom:-12px;}
.qd-search input{width:min(420px,100%);height:44px;box-sizing:border-box;padding:0 16px;border:1px solid var(--qd-ink);border-radius:999px;background:var(--qd-tile);color:var(--qd-ink);font:inherit;font-size:15px;font-weight:700;}
.qd-setup{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:16px 26px;}
.qd-grp{display:flex;flex-direction:column;align-items:center;gap:8px;}
.qd-lab{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.72;}
.qd-seg{display:inline-flex;flex:none;max-width:100%;border:1px solid var(--qd-ink);border-radius:999px;overflow:hidden;}
.qd-seg button{flex:none;white-space:nowrap;font:inherit;font-size:13.5px;font-weight:800;height:38px;padding:0 15px;border:0;border-left:1px solid var(--qd-ink);border-radius:0;background:transparent;color:var(--qd-ink);cursor:pointer;}
.qd-seg button:first-child{border-left:0;}
.qd-seg button.on{background:var(--qd-ink);color:var(--qd-bg);}
.qd-note{flex-basis:100%;margin:-4px 0 0;text-align:center;font-size:13px;font-weight:700;opacity:.72;}
.qd-drops{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1.25fr);gap:8px;width:min(460px, 100%);align-self:center;margin-top:-8px;}
.qd-dd{position:relative;display:flex;align-items:center;min-width:0;}
.qd-dd select{appearance:none;-webkit-appearance:none;width:100%;min-width:0;height:42px;padding:0 32px 0 16px;border:1px solid var(--qd-ink);border-radius:999px;background:var(--qd-tile);color:var(--qd-ink);font:inherit;font-size:14px;font-weight:800;cursor:pointer;text-overflow:ellipsis;}
.qd-dd select:focus-visible{outline:3px solid var(--qd-ink);outline-offset:2px;}
.qd-dd svg{position:absolute;right:13px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--qd-ink);}
.qd-dd.off select{opacity:.55;cursor:default;}
.qd-dd.off svg{opacity:.35;}
.qd-dd option{background:#ffffff;color:#08222e;}
.qd-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
.qd-err{margin:-10px 0 0;text-align:center;font-weight:800;}
.qd-go{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;width:100%;min-height:150px;box-sizing:border-box;padding:22px 20px;border:0;border-radius:26px;background:var(--qd-ink);font-family:inherit;cursor:pointer;}
.qd-go,.qd-go *{color:var(--qd-bg) !important;}
.qd-go.big{min-height:230px;}
.qd-go:active{transform:scale(.985);}
@media(hover:hover){.qd-go:hover{filter:brightness(1.12);}}
.qd-go:disabled{cursor:progress;opacity:.85;}
.qd-gname{font-size:clamp(36px, 8vw, 56px);font-weight:800;letter-spacing:-0.025em;line-height:1.12;padding-bottom:.06em;text-align:center;overflow-wrap:break-word;max-width:100%;}
.qd-go.big .qd-gname{font-size:clamp(40px, 10vw, 76px);}
.qd-gsub{font-size:15px;font-weight:700;opacity:.82;text-align:center;line-height:1.4;}
.qd-play{display:inline-flex;align-items:center;gap:9px;margin-top:4px;font-size:19px;font-weight:800;}
.qd-mine{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;}
.qd-rec{margin:-8px 0 0;text-align:center;font-size:13.5px;font-weight:700;opacity:.78;line-height:1.5;}
.qd-rec a{font-weight:800;}
.qd-fold{margin-top:54px;border-top:1px solid color-mix(in srgb, var(--qd-ink) 22%, transparent);padding:46px 20px 60px;}
.qd-in{max-width:1080px;margin:0 auto;}
.qd-fold h2{margin:0 0 8px;font-size:26px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;}
.qd-lede{margin:0 0 24px;max-width:760px;font-size:16px;font-weight:600;line-height:1.55;opacity:.85;}
.qd-lede.sm{font-size:14px;margin-top:18px;}
.qd-mini{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px;}
.qd-ms{display:flex;flex-direction:column;align-items:center;gap:14px;padding:22px 20px;border:1px solid var(--qd-ink);border-radius:22px;background:var(--qd-tile);}
.qd-ms *{color:var(--qd-tink, var(--qd-ink));}
.qd-pill{display:inline-flex;padding:4px 11px;border:1px solid currentColor;border-radius:999px;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;}
.qd-msq{margin:0;text-align:center;font-size:20px;font-weight:800;line-height:1.25;}
.qd-msq span{display:block;margin-top:6px;font-size:14px;font-weight:700;opacity:.8;}
.qd-msc{display:grid;grid-template-columns:1fr 1fr;gap:9px;width:100%;}
.qd-msc span{display:flex;align-items:center;justify-content:center;text-align:center;min-height:54px;padding:6px 8px;border:1px solid var(--qd-tink, var(--qd-ink));border-radius:14px;font-size:15px;font-weight:800;}
.qd-msc span.ok{background:var(--qd-tink, var(--qd-ink));color:var(--qd-bg);}
.qd-qa{border-top:1px solid color-mix(in srgb, var(--qd-ink) 18%, transparent);}
.qd-qr{display:grid;grid-template-columns:170px 1fr;gap:16px;padding:15px 0;border-bottom:1px solid color-mix(in srgb, var(--qd-ink) 18%, transparent);}
.qd-ql{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.65;padding-top:4px;}
.qd-qr b{display:block;font-size:17px;line-height:1.4;}
.qd-qa{list-style:none;margin:0;padding:0;}
.qd-ch{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:4px 18px;font-size:15px;font-weight:600;line-height:1.4;}
.qd-ch i{font-style:normal;font-weight:800;opacity:.6;margin-right:4px;}
.qd-rev{margin-top:8px;}
.qd-rev summary{display:inline-block;cursor:pointer;font-size:13.5px;font-weight:800;text-decoration:underline;text-underline-offset:3px;list-style:none;}
.qd-rev summary::-webkit-details-marker{display:none;}
.qd-rev[open] summary{display:none;}
.qd-subh{margin-top:36px;}
.qd-subh + .qd-links{margin-top:14px;}
@media (max-width:640px){.qd-ch{grid-template-columns:1fr;}}
.qd-ans{display:inline-flex;margin-top:8px;padding:4px 11px;border-radius:999px;background:var(--qd-ink);color:var(--qd-bg) !important;font-size:13.5px;font-weight:800;}
.qd-faq{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:0 40px;margin-top:40px;}
.qd-faq div{padding:16px 0;border-top:1px solid color-mix(in srgb, var(--qd-ink) 18%, transparent);}
.qd-faq h2{font-size:16px;margin:0 0 6px;letter-spacing:0;}
.qd-faq p{margin:0;font-size:14.5px;font-weight:600;line-height:1.55;opacity:.84;}
.qd-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:34px;}
.qd-links a{padding:8px 14px;border:1px solid var(--qd-ink);border-radius:999px;font-size:13.5px;font-weight:800;text-decoration:none;}
.qd-links a:hover{background:var(--qd-tile);}
.qd-leave{font:inherit;font-weight:800;background:none;border:0;padding:0;text-decoration:underline;cursor:pointer;color:inherit;}
.qd-end{position:fixed;inset:0;z-index:90;background:var(--qd-bg);color:var(--qd-ink);display:flex;align-items:center;justify-content:center;overflow-y:auto;font-family:'Manrope',system-ui,sans-serif;}
.qd-end *{color:var(--qd-ink);}
.qd-endin{width:100%;max-width:560px;box-sizing:border-box;padding:40px 20px;display:flex;flex-direction:column;align-items:stretch;gap:16px;text-align:center;}
.qd-eye{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.75;}
.qd-score{font-size:clamp(64px, 18vw, 104px);font-weight:800;letter-spacing:-0.04em;line-height:1.02;padding-bottom:.06em;}
.qd-endsub{font-size:16px;font-weight:700;line-height:1.5;opacity:.82;}
.qd-end .qd-go{min-height:220px;margin-top:8px;}
.qd-end .qd-go .qd-gname{font-size:clamp(40px, 11vw, 60px);}
.qd-endrow{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;}
.qd-endrow .qd-tile{min-height:64px;}
/* The start bar: sticky at the foot of the screen until the site footer. */
.qd-bar{position:sticky;bottom:max(12px, env(safe-area-inset-bottom));z-index:20;display:flex;align-items:center;gap:14px;width:min(760px, calc(100% - 24px));box-sizing:border-box;margin:26px auto 0;padding:12px 12px 12px 22px;border-radius:24px;background:var(--qd-ink);box-shadow:0 12px 34px rgba(0,0,0,.28);}
.qd-bar,.qd-bar *{color:var(--qd-bg);}
.qd-bt{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
.qd-bt b{font-size:19px;font-weight:800;line-height:1.25;padding-bottom:.06em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.qd-bt small{font-size:13px;font-weight:700;opacity:.85;}
.qd-chg{font:inherit;font-weight:800;background:none;border:0;padding:0;text-decoration:underline;text-underline-offset:2px;cursor:pointer;}
.qd-bgo{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:58px;padding:0 26px;border:0;border-radius:18px;background:var(--qd-bg);font:inherit;font-size:19px;font-weight:800;cursor:pointer;}
.qd-bgo,.qd-bgo *{color:var(--qd-ink) !important;}
.qd-bgo:disabled{opacity:.7;cursor:progress;}
@media(hover:hover){.qd-bgo:hover{filter:brightness(.95);}}
.qd-hint{margin:-12px 0 0;text-align:center;font-size:13.5px;font-weight:700;opacity:.75;}
.qd-sheet{position:fixed;inset:0;z-index:95;background:rgba(8,34,46,.55);display:flex;align-items:center;justify-content:center;}
.qd-sin{width:min(560px, 100%);box-sizing:border-box;background:var(--qd-bg);border-radius:26px;padding:16px 20px 22px;display:flex;flex-direction:column;align-items:stretch;gap:18px;box-shadow:0 20px 60px rgba(0,0,0,.3);}
.qd-grab{align-self:center;width:44px;height:5px;border-radius:3px;background:var(--qd-ink);opacity:.3;}
.qd-stitle{margin:0;text-align:center;font-size:24px;font-weight:800;letter-spacing:-0.01em;}
.qd-sin .qd-setup{flex-direction:column;align-items:center;flex-wrap:nowrap;gap:14px;}
.qd-srow{display:flex;gap:10px;}
.qd-srow .qd-tile{flex:1;min-height:58px;}
.qd-srow .qd-bgo{flex:1;background:var(--qd-ink);}
.qd-srow .qd-bgo,.qd-srow .qd-bgo *{color:var(--qd-bg) !important;}
@media(min-width:900px){
  .qd-col{gap:34px;padding-top:34px;}
  .qd-q{font-size:48px;}
  .qd-tname{font-size:23px;}
  .qd-grid .qd-tile{min-height:140px;}
}
@media(max-width:560px){
  .qd-col{padding:18px 14px 10px;gap:22px;}
  .qd-q{font-size:28px;}
  .qd-grid{gap:10px;}
  .qd-grid,.qd-lanes:not(.many){grid-template-columns:repeat(4,minmax(0,1fr));}
  .qd-grid > li:last-child:nth-child(3n+1),.qd-grid > li:nth-last-child(2):nth-child(3n+1),
  .qd-lanes:not(.many) > .qd-tile:last-child:nth-child(3n+1),.qd-lanes:not(.many) > .qd-tile:nth-last-child(2):nth-child(3n+1){grid-column:auto / span 2;}
  .qd-grid > li:last-child:nth-child(2n+1),.qd-lanes:not(.many) > .qd-tile:last-child:nth-child(2n+1){grid-column:2 / span 2;}
  .qd-grid .qd-tile{min-height:92px;padding:12px 10px;}
  .qd-num{display:none;}
  .qd-tname{font-size:17px;}
  .qd-tsub{font-size:12px;}
  .qd-lanes{gap:10px;}
  .qd-lanes.many{grid-template-columns:1fr 1fr;}
  .qd-lanes .qd-tile{min-height:84px;padding:10px;}
  .qd-setup{flex-direction:column;align-items:center;flex-wrap:nowrap;gap:12px;}
  .qd-drops{gap:6px;}
  .qd-drops{gap:6px;grid-template-columns:minmax(0,106px) minmax(0,108px) minmax(0,1fr);}
  .qd-dd select{height:40px;font-size:12.5px;padding:0 20px 0 8px;text-align:center;text-align-last:center;}
  .qd-dd svg{right:7px;width:10px;height:10px;}
  .qd-note{margin-top:0;}
  .qd-seg button{font-size:12.5px;padding:0 11px;height:36px;}
  .qd-go{min-height:140px;}
  .qd-go.big{min-height:180px;}
  .qd-mine{grid-template-columns:1fr;}
  .qd-qr{grid-template-columns:1fr;gap:4px;}
  .qd-fold{padding:36px 14px 48px;}
  .qd-bar{padding:10px 10px 10px 16px;gap:10px;border-radius:20px;}
  .qd-bt b{font-size:16px;}
  .qd-bt small{font-size:12px;}
  .qd-bgo{height:52px;padding:0 18px;font-size:17px;}
  .qd-sheet{align-items:flex-end;}
  .qd-sin{border-radius:26px 26px 0 0;padding-bottom:max(22px, env(safe-area-inset-bottom));}
}
@media (prefers-reduced-motion: reduce){.qd-tile,.qd-go{transition:none}}
`;
