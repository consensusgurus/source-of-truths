'use client';

// Bacon: link two actors through the films they share, the way the Kevin Bacon
// game does. Each day names a start actor and a target. The player names a
// film the current actor is in, then types an actor from that film's cast, and
// so on until the target is reached, in seven films or fewer. Every actor is
// typed (no cast list is shown: the knowing is the game). A film the current
// actor is not in, or an actor who is not in the film, is a strike; three
// strikes end the day. Text that matches no film or actor costs nothing.
// Fewest films ranks highest, then the clock. Runs on the shared stage shell
// (app/SimpleDaily.jsx).
//
// The film graph is public/bacon/graph.json (American films 1930 to 2022 with
// their principal cast, scripts/gen-bacon-graph.py), fetched once by the
// browser and cached. It holds no answers; the day's pair and par come from
// app/bacon/puzzles.js through the server page.

import React, { useEffect, useMemo, useState } from 'react';
import SimpleDaily from '../SimpleDaily';

const MAX_FILMS = 7;
const MAX_STRIKES = 3;

function fold(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim(); }

// ── the graph ────────────────────────────────────────────────────────────────
let graphPromise = null;
let graphCache = null;
function buildGraph(raw) {
  const actors = raw.actors;
  const films = raw.films.map(([t, y, ids], i) => ({ i, t, y, ids, key: `${t}|${y}`, ft: fold(t), set: new Set(ids) }));
  const actorIx = new Map(actors.map((n, i) => [n, i]));
  const filmIx = new Map(films.map((f) => [f.key, f.i]));
  const actorList = actors.map((n, i) => ({ i, n, fn: fold(n) }));
  return { actors, films, actorIx, filmIx, actorList };
}
function loadGraph() {
  if (graphCache) return Promise.resolve(graphCache);
  if (!graphPromise) {
    graphPromise = fetch('/bacon/graph.json')
      .then((r) => { if (!r.ok) throw new Error('graph'); return r.json(); })
      .then((raw) => { graphCache = buildGraph(raw); return graphCache; })
      .catch((e) => { graphPromise = null; throw e; });
  }
  return graphPromise;
}
function useGraph() {
  const [g, setG] = useState(graphCache);
  const [err, setErr] = useState(false);
  useEffect(() => {
    if (graphCache) return undefined;
    let live = true;
    loadGraph().then((x) => { if (live) setG(x); }).catch(() => { if (live) setErr(true); });
    return () => { live = false; };
  }, []);
  return { g, err };
}

// ── the type-ahead ───────────────────────────────────────────────────────────
// Starts-with first, then a word that starts with the text, then every typed
// word as a word prefix. The lists are stored best known first, so that order
// holds inside each tier.
function rank(list, field, query, skip, limit = 6) {
  const qf = fold(query);
  if (!qf) return [];
  const qw = qf.split(' ');
  const tiers = [[], [], []];
  for (const it of list) {
    if (skip && skip(it)) continue;
    const f = it[field];
    let tier = -1;
    if (f.startsWith(qf)) tier = 0;
    else if (f.includes(' ' + qf)) tier = 1;
    else if (qw.length > 1) { const w = f.split(' '); if (qw.every((x) => w.some((y) => y.startsWith(x)))) tier = 2; }
    if (tier >= 0) { tiers[tier].push(it); if (tier === 0 && tiers[0].length >= limit) break; }
  }
  return tiers.flat().slice(0, limit);
}

// ── state helpers ────────────────────────────────────────────────────────────
// s.steps: [{ f: 'Title|Year', a: 'Actor name' | null }]. Names, not indexes,
// so a rebuilt graph never breaks a save.
const lastActor = (P, s) => {
  const st = s.steps || [];
  for (let k = st.length - 1; k >= 0; k--) if (st[k].a) return st[k].a;
  return P.from;
};
const pending = (s) => { const st = s.steps || []; return st.length && !st[st.length - 1].a ? st[st.length - 1] : null; };
const filmLabel = (key) => { const [t, y] = String(key).split('|'); return { t, y }; };
const films = (s) => (s.steps || []).length;
const plural = (n) => `${n} film${n === 1 ? '' : 's'}`;

const CSS = `
.bn{display:flex;flex-direction:column;gap:10px;width:100%;}
.bn-q{margin:0;text-align:center;font-size:clamp(20px,5.8vw,24px);font-weight:800;letter-spacing:-.02em;}
.bn-pair{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;border:1px solid var(--pst-ink,#0b0f1a);border-radius:16px;background:var(--pst-cell,#f1f4f8);padding:12px;}
.bn-end{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;}
.bn-end b{font-size:15px;font-weight:800;line-height:1.2;}
.bn-end small{font-size:11px;font-weight:800;letter-spacing:.06em;color:var(--pst-mute,#3b4656);}
.bn-av{width:42px;height:42px;border-radius:21px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;box-sizing:border-box;border:1px solid var(--pst-ink,#0b0f1a);background:var(--pst-bg,#fff);}
.bn-av.tg{background:var(--pst-acc,#fb923c);color:var(--pst-on-acc,#0b0f1a);}
.bn-arrow{stroke:var(--pst-mute,#3b4656);}
.bn-ch{list-style:none;margin:0;padding:12px;border:1px solid var(--pst-ink,#0b0f1a);border-radius:16px;display:flex;flex-direction:column;}
.bn-ch li{display:flex;align-items:center;gap:10px;min-height:36px;}
.bn-ch li.ac{font-size:15px;font-weight:800;}
.bn-ch li.fm{border:1px solid var(--pst-ink,#0b0f1a);border-radius:10px;padding:6px 10px;background:var(--pst-cell,#f1f4f8);font-size:14px;font-weight:700;}
.bn-ch li.fm span{margin-left:auto;font-weight:700;color:var(--pst-mute,#3b4656);font-size:13px;}
.bn-ch li.nx{color:var(--pst-mute,#3b4656);font-size:14px;font-weight:700;}
.bn-ch li.tg{color:var(--pst-mute,#3b4656);font-size:15px;font-weight:800;}
.bn-ch li.tg.hit{color:inherit;}
.bn-ch i{display:block;width:2px;height:12px;margin-left:16px;background:var(--pst-ink,#0b0f1a);}
.bn-ch i.gap{height:auto;flex:1;min-height:12px;background:var(--pst-cell-line,#c9d2dc);}
.bn-dot{width:12px;height:12px;border-radius:6px;flex:none;margin:0 5px;border:2px solid var(--pst-ink,#0b0f1a);box-sizing:border-box;}
.bn-dot.on{background:var(--pst-ink,#0b0f1a);}
.bn-dot.tg{background:var(--pst-acc,#fb923c);}
.bn-ico{flex:none;stroke:var(--pst-ink,#0b0f1a);}
.bn-miss{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:13px;font-weight:800;}
.bn-miss s{text-decoration:none;border:1px solid var(--pst-ink,#0b0f1a);border-radius:999px;padding:4px 10px;font-weight:700;}
.bn-par{border:1px solid var(--pst-ink,#0b0f1a);border-radius:16px;padding:12px;}
.bn-par h3{margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:.06em;color:var(--pst-mute,#3b4656);}
.bn-par p{margin:0;display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:14px;font-weight:800;line-height:1.6;}
.bn-par em{font-style:normal;font-weight:700;background:var(--pst-cell,#f1f4f8);border:1px solid var(--pst-ink,#0b0f1a);border-radius:6px;padding:1px 8px;}
.bn-tools{display:flex;flex-direction:column;gap:8px;}
.bn-tools .pst-sug{border-radius:0;}
.bn-tools .pst-sug button{display:flex;justify-content:space-between;align-items:center;gap:10px;}
.bn-tools .pst-sug button small{font-size:13px;font-weight:800;opacity:.8;flex:none;}
.bn-lab{font-size:14px;font-weight:800;margin:0;}
.bn-row{display:flex;justify-content:space-between;align-items:center;gap:8px;}
`;

const initials = (n) => String(n).split(/\s+/).filter(Boolean).map((w) => w[0]).filter((c) => /[A-Za-z]/.test(c)).slice(0, 2).join('').toUpperCase();
const Film = () => (
  <svg className="bn-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M8 5v4M16 5v4" /></svg>
);

function ParChain({ P, title }) {
  return (
    <div className="bn-par">
      <h3>{title}</h3>
      <p>
        {P.chain.map((x, k) => (typeof x === 'string'
          ? <span key={k}>{x}</span>
          : <em key={k}>{`${x[0]} (${x[1]})`}</em>))}
      </p>
    </div>
  );
}

function Board({ P, s, done }) {
  const steps = s.steps || [];
  const won = !!s.hit;
  const misses = s.misses || [];
  const pend = pending(s);
  const cur = lastActor(P, s);
  return (
    <div className="bn">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {!done ? <h2 className="bn-q">Link the two actors</h2> : null}
      <div className="bn-pair" aria-label={`From ${P.from} to ${P.to}`}>
        <div className="bn-end"><span className="bn-av" aria-hidden="true">{initials(P.from)}</span><b>{P.from}</b><small>START</small></div>
        <svg width="28" height="14" viewBox="0 0 28 14" fill="none" strokeWidth="2" className="bn-arrow" aria-hidden="true"><path d="M2 7h22M18 2l6 5-6 5" /></svg>
        <div className="bn-end"><span className="bn-av tg" aria-hidden="true">{initials(P.to)}</span><b>{P.to}</b><small>TARGET</small></div>
      </div>
      <ol className="bn-ch" aria-label="Your chain">
        <li className="ac"><span className="bn-dot on" aria-hidden="true" />{P.from}</li>
        {steps.map((st, k) => {
          const f = filmLabel(st.f);
          const hitHere = won && k === steps.length - 1;
          return (
            <React.Fragment key={k}>
              <i aria-hidden="true" />
              <li className="fm"><Film />{f.t}<span>{f.y}</span></li>
              {st.a && !hitHere ? (<><i aria-hidden="true" /><li className="ac"><span className="bn-dot on" aria-hidden="true" />{st.a}</li></>) : null}
            </React.Fragment>
          );
        })}
        {!done ? (
          <>
            <i aria-hidden="true" />
            <li className="nx">{pend ? `Who in ${filmLabel(pend.f).t} do you jump to?` : `Name a film ${cur} was in`}</li>
          </>
        ) : null}
        <i className={won ? undefined : 'gap'} aria-hidden="true" />
        <li className={'tg' + (won ? ' hit' : '')}><span className="bn-dot tg" aria-hidden="true" />{P.to}</li>
      </ol>
      {misses.length ? (
        <div className="bn-miss"><span>Strikes</span>{misses.map((m, k) => <s key={k}>{m}</s>)}</div>
      ) : null}
      {done ? <ParChain P={P} title={`The shortest link: ${plural(P.par)} (par ${P.par})`} /> : null}
    </div>
  );
}

function Tools({ P, s, setS, active }) {
  const { g, err } = useGraph();
  const [q, setQ] = useState('');
  const pend = pending(s);
  const cur = lastActor(P, s);
  const mode = pend ? 'actor' : 'film';
  const steps = s.steps || [];
  const usedFilms = useMemo(() => new Set(steps.map((x) => x.f)), [steps]);
  const usedActors = useMemo(() => new Set([P.from, ...steps.map((x) => x.a).filter(Boolean)]), [steps, P.from]);
  const opts = useMemo(() => {
    if (!g || !active) return [];
    if (mode === 'film') return rank(g.films, 'ft', q, (f) => usedFilms.has(f.key));
    return rank(g.actorList, 'fn', q, (a) => usedActors.has(a.n));
  }, [g, active, mode, q, usedFilms, usedActors]);
  useEffect(() => { setQ(''); }, [mode]);
  if (!active) return null;
  if (err) return <div className="pst-note">The film list did not load. Check your connection and reload the page.</div>;
  if (!g) return <div className="pst-note">Loading the film list...</div>;
  const atLimit = mode === 'film' && steps.length >= MAX_FILMS;

  const strike = (st, text) => {
    const misses = [...(st.misses || []), text];
    return { ...st, misses, out: misses.length >= MAX_STRIKES };
  };
  const pickFilm = (f) => {
    setQ('');
    setS((st) => {
      if (pending(st) || (st.steps || []).length >= MAX_FILMS) return st;
      const who = lastActor(P, st);
      const ai = g.actorIx.get(who);
      if (ai != null && f.set.has(ai)) return { ...st, steps: [...(st.steps || []), { f: f.key, a: null }] };
      return strike(st, `${f.t} (${f.y}): no ${who}`);
    });
  };
  const pickActor = (a) => {
    setQ('');
    setS((st) => {
      const p = pending(st);
      if (!p) return st;
      const fi = g.filmIx.get(p.f);
      const film = fi != null ? g.films[fi] : null;
      if (film && film.set.has(a.i)) {
        const steps2 = [...st.steps.slice(0, -1), { f: p.f, a: a.n }];
        return { ...st, steps: steps2, hit: a.n === P.to ? a.n : null };
      }
      return strike(st, `${a.n}: not in ${filmLabel(p.f).t}`);
    });
  };
  const undo = () => {
    setQ('');
    setS((st) => {
      const st2 = [...(st.steps || [])];
      if (!st2.length) return st;
      const last = st2[st2.length - 1];
      if (last.a) st2[st2.length - 1] = { f: last.f, a: null };
      else st2.pop();
      return { ...st, steps: st2 };
    });
  };
  const choose = (o) => (mode === 'film' ? pickFilm(o) : pickActor(o));
  const noMatch = fold(q).length >= 2 && !opts.length;
  const strikesLeft = MAX_STRIKES - (s.misses || []).length;

  return (
    <div className="bn-tools">
      {atLimit ? (
        <div className="pst-note">{`That is ${MAX_FILMS} films, the limit. Undo a step to try another way.`}</div>
      ) : (
        <>
          <p className="bn-lab">{mode === 'film' ? `A film ${cur} was in` : `An actor in ${filmLabel(pend.f).t}`}</p>
          {opts.length ? (
            <div className="pst-sug" role="listbox" aria-label={mode === 'film' ? 'Matching films' : 'Matching actors'}>
              {opts.map((o, i) => (
                <button key={o.i} type="button" role="option" aria-selected={i === 0} className={i === 0 ? 'on' : undefined} onClick={() => choose(o)}>
                  <span>{mode === 'film' ? o.t : o.n}</span>{mode === 'film' ? <small>{o.y}</small> : null}
                </button>
              ))}
            </div>
          ) : noMatch ? (
            <div className="pst-sug" aria-live="polite"><div className="none">{mode === 'film' ? 'No film in our list matches that. It has cost you nothing.' : 'No actor in our list matches that. It has cost you nothing.'}</div></div>
          ) : null}
          <div className="pst-in">
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (opts.length) choose(opts[0]); } }}
              placeholder={mode === 'film' ? 'Film title' : 'Actor name'} aria-label={mode === 'film' ? `Name a film ${cur} was in` : `Name an actor in ${filmLabel(pend.f).t}`}
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
            <button type="button" className="pst-go" disabled={!opts.length} onClick={() => { if (opts.length) choose(opts[0]); }}>Add</button>
          </div>
        </>
      )}
      <div className="bn-row">
        <span className="pst-note">{`${strikesLeft} ${strikesLeft === 1 ? 'strike' : 'strikes'} left`}</span>
        {steps.length ? <button type="button" className="pst-tb" onClick={undo}>Undo last step</button> : null}
      </div>
    </div>
  );
}

const GAME = {
  key: 'bacon', name: 'Bacon', cat: 'Trivia', miss: 'films',
  fresh: () => ({ steps: [], misses: [], hit: null, out: false }),
  validSave: (P, s) => Array.isArray(s.steps) && Array.isArray(s.misses),
  touched: (s) => (s.steps || []).length > 0 || (s.misses || []).length > 0,
  solved: (P, s) => !!s.hit,
  failed: (P, s) => !!s.out,
  count: (s) => films(s),
  // Solved in f films scores 8 - f (7 down to 1); unsolved scores 0. Fewer
  // films rank higher, then the clock.
  result: (P, s, won) => ({ score: won ? MAX_FILMS + 1 - films(s) : 0, total: MAX_FILMS, correct: won ? 1 : 0, guessesUsed: films(s) }),
  Board,
  tools: (props) => <Tools {...props} />,
  eyebrow: (P, s, { sundayLabel }) => `No. ${P.num}${sundayLabel ? ` · ${sundayLabel}` : ''} · Par ${P.par}`,
  foot: (P, s) => `${plural(films(s))} used · ${(s.misses || []).length} of ${MAX_STRIKES} strikes · limit ${MAX_FILMS} films`,
  frac: (P, s) => Math.min(1, films(s) / MAX_FILMS),
  sundayLabel: () => 'Sunday Edition',
  gateTitle: (P) => (P.sunday ? `Sunday Edition: ${P.from} to ${P.to}` : `Today: ${P.from} to ${P.to}`),
  gateLine: (P) => `Link ${P.from} to ${P.to} through films they share. Name a film, then an actor in it, and keep going. Par is ${plural(P.par)}. Fewest films wins.`,
  rules: (P) => ({
    lead: 'Link two actors through the films they made together.',
    steps: [
      <>Start from today&rsquo;s first actor. <b>Name a film</b> they were in, then <b>type an actor</b> from that film&rsquo;s cast. That actor is your new link.</>,
      <>Keep going until you reach the <b>target</b>, in <b>seven films or fewer</b>. Par is the fewest films in our list that can do it.</>,
      <>A film your actor was not in, or an actor who was not in the film, is a <b>strike</b>. Three strikes end the day. Typing something that is not in the list costs nothing, and <b>Undo</b> is free.</>,
    ],
    knack: 'Head for a busy actor first. Someone who has made a film a year for decades is one step from almost everybody.',
    footer: 'Films are American releases from 1930 to 2022, with the main cast Wikipedia lists for each. A solve ranks on films used, then on the clock. The Sunday Edition starts from a classic star.',
  }),
  pitch: (P) => `Link ${P.from} to ${P.to} through their films.`,
  shareLine: (P, s, won, el) => `Bacon #${P.num}${P.sunday ? ' · Sunday' : ''} · ${P.from} to ${P.to} · ${won ? `${plural(films(s))} (par ${P.par}) · ${el}` : 'not solved'}\n${won ? Array.from({ length: films(s) }, () => '\u{1F3AC}').join('') : '⬜'}`,
  detail: (P, s, won, el) => `${P.from} to ${P.to} · ${won ? plural(films(s)) : 'not solved'} · par ${P.par} · ${el}`,
  aboutTitle: 'About Bacon',
  about: [
    'Bacon is a free daily movie trivia game from Mind Loft, played like Six Degrees of Kevin Bacon. Every day it names two actors. You link them through films: name a film the first actor was in, type a co-star from it, and keep going until you reach the second actor.',
    'Par is the fewest films that can link the pair, and the fewer you use, the higher you rank, with the clock breaking a tie. A wrong film or a wrong co-star is a strike, and three strikes end the day. Weekdays pair stars of today; the Sunday Edition starts from a classic Hollywood star.',
    <>More film trivia: try <a href="/script" style={{ color: 'inherit', fontWeight: 800 }}>Script</a>, <a href="/thread" style={{ color: 'inherit', fontWeight: 800 }}>Thread</a> and <a href="/quotes" style={{ color: 'inherit', fontWeight: 800 }}>Quotes</a>.</>,
  ],
};

export default function BaconClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
