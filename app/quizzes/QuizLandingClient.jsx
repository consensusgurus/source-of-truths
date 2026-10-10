'use client';

// THE QUIZ HOME, ON THE STAGE.
//
// The daily home (app/today/StageToday.jsx) is the model, and that is the
// point: the two halves of this site had drifted into two design systems, and
// the quiz surface came back onto the stage on 2026-09-04. This page applies
// the same rules to the CATALOGUE that StageToday applies to the roster:
//
//   1. THE PAGE IS THE THING. One cap line. No masthead, no rails.
//   2. ONE GROUND, ONE COLOUR FAMILY. The ground is --stg-ground and the
//      family is the same NINE CATEGORY STEPS the daily home spends, read
//      out of lib/category-ramp.js rather than restated here. Fifteen topics
//      over ten steps means two topics share a hue, which is the price of not
//      inventing six more.
//   3. FIGURES, NEVER PROSE.
//   4. DRAW THE FIELD ONLY WHEN REAL. A featured slot that is waiting on a
//      read holds its own footprint rather than guessing.
//
// WHAT IT IS NOT: a second index. /quizzes/all is the alphabetical crawl path
// and stays that; this is the surface a reader browses, and every shelf here
// links into that index.
//
// THREE THINGS IT DOES THAT THE DAILY HOME DOES NOT, each because 1,800
// quizzes is not 86 games:
//   * A SEARCH LINE. Eighty-six games can be scanned; a catalogue has to be
//     asked. It filters the payload already in hand, so it costs no request.
//   * HERO ART, ON THREE TILES ONLY. A daily is a mechanic and needs no
//     picture; a quiz is a subject. The art stops at the featured row.
//   * A CATALOGUE RAIL instead of a day rail: the 2px line under the cap
//     counts how much of the shelf this reader has taken down.
import { useEffect, useMemo, useRef, useState } from 'react';
import MindLoftMark from '../MindLoftMark';
import StageFooter from '../StageFooter';
import { useStageTheme, useThemeQs } from '@/lib/stage-theme';
import { CATEGORY_RAMP, CATEGORY_RAMP_LIGHT } from '@/lib/category-ramp';
import { QUIZ_HEROES, DEPT_HERO } from '@/lib/quiz-heroes';

const MONO = "'Manrope', ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = "Manrope, ui-sans-serif, system-ui, -apple-system, sans-serif";

// HOW MANY TILES A SHELF PEEKS. Geography alone is 438; a shelf is a sample
// with a way through to the rest, never the topic.
const PEEK = 12;
// The shelves that are open on arrival. The rest are their heads, which is the
// daily home's own rule for a shut section: the tiles stay in the HTML, so the
// page keeps its internal links whether or not a reader opens anything.
const OPEN_ON_ARRIVAL = new Set(['movies', 'sports', 'geography', 'entertainment']);

function fmtDate(d) {
  try {
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  } catch (e) { return ''; }
}

function clock(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  if (!s) return '';
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// The tagline under a quiz name, in the site's own words: the quiz cap says
// "24 answers" and the mcq clients say "questions", so this says what that
// quiz will say when it opens rather than inventing a third vocabulary.
function tagOf(q) {
  const bits = [];
  if (q.n) bits.push(q.n + ' ' + (q.mcq ? (q.n === 1 ? 'question' : 'questions') : (q.n === 1 ? 'answer' : 'answers')));
  const t = clock(q.t);
  if (t) bits.push(t);
  return bits.join(' · ');
}

// THE PHOTO FOR A FEATURED TILE: the quiz own entry in the hero registry, else
// its department photo. Never a colour block -- a slot with no picture is a
// slot this page does not draw at all, which is the honest version of "only
// when real".
function heroFor(q) {
  if (!q) return null;
  const own = QUIZ_HEROES[q.id];
  if (own && own.src) return { src: own.src, pos: own.pos };
  const dept = DEPT_HERO[q.dept];
  return dept ? { src: dept, pos: undefined } : null;
}

// The same identity every other surface sends, so this page cannot disagree
// with the home about whose figures it is showing.
function identityQs() {
  const p = new URLSearchParams();
  try { const a = localStorage.getItem('sot_quiz_anon'); if (a) p.set('anonId', a); } catch (e) {}
  try {
    const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
    if (id && id.email) p.set('email', id.email);
  } catch (e) {}
  return p.toString();
}

export default function QuizLandingClient() {
  const [stageTheme, setStageTheme] = useStageTheme();
  const tq = useThemeQs();
  const withTq = (href) => (tq ? href + (href.includes('?') ? tq : '?' + tq.slice(1)) : href);

  const [topics, setTopics] = useState(null);
  const [popular, setPopular] = useState(null);
  const [me, setMe] = useState(null);
  const [meIn, setMeIn] = useState(false);
  const [openIds, setOpenIds] = useState(OPEN_ON_ARRIVAL);
  const [fullIds, setFullIds] = useState(() => new Set());
  const [query, setQuery] = useState('');
  // THE DATE IS CLIENT-ONLY. A server component renders this page, so a date
  // computed during render is the SERVER clock and hydrates against the
  // reader own one; across midnight, or across a timezone, that is a
  // mismatch. It lands in an effect instead and the cell is simply absent for
  // one frame, which is what the cap does with every other figure it waits on.
  const [day, setDay] = useState(null);

  // THE CATALOGUE IS A STATIC ROUTE (force-static, built at deploy), so it is
  // an edge read and is asked for immediately rather than on scroll: the
  // shelves ARE this page, unlike on the daily home where they are its foot.
  useEffect(() => {
    let alive = true;
    fetch('/api/quiz/topics')
      .then((r) => r.json())
      .then((d) => { if (alive && d && Array.isArray(d.topics)) setTopics(d.topics); })
      .catch(() => {});
    // Eight rows, cached ten minutes in-module: the cheapest true answer to
    // "what is everyone playing". Only the featured row waits on it.
    fetch('/api/quiz/popular-by-category')
      .then((r) => r.json())
      .then((d) => { if (alive && d && Array.isArray(d.cats)) setPopular(d.cats); })
      .catch(() => {});
    const qs = identityQs();
    if (qs) {
      fetch('/api/quiz/me?light=1&' + qs)
        .then((r) => r.json())
        .then((d) => { if (alive) { setMe(d && d.found ? d : null); setMeIn(true); } })
        .catch(() => { if (alive) setMeIn(true); });
    } else { setMeIn(true); }
    return () => { alive = false; };
  }, []);

  // Arm the fade only when the document is visible at mount: a browser does
  // not advance an animation clock in a hidden tab, so without this gate a
  // page opened in a background tab holds every section at opacity 0. Same
  // gate, same reason, as the daily home.
  useEffect(() => { setDay(new Date()); }, []);

  const rootRef = useRef(null);
  useEffect(() => {
    if (typeof document === 'undefined' || document.visibilityState === 'hidden') return undefined;
    const root = rootRef.current;
    if (!root) return undefined;
    root.setAttribute('data-qzh-anim', '1');
    return () => root.removeAttribute('data-qzh-anim');
  }, []);

  const list = topics || [];
  const total = useMemo(() => list.reduce((a, t) => a + (t.count || 0), 0), [list]);
  const byId = useMemo(() => {
    const m = new Map();
    for (const t of list) for (const q of (t.quizzes || [])) m.set(q.id, { ...q, dept: t.id, deptLabel: t.label });
    return m;
  }, [list]);

  const played = useMemo(() => new Set((me && me.playedIds) || []), [me]);
  const playedHere = useMemo(() => {
    if (!played.size || !byId.size) return 0;
    let n = 0;
    for (const id of played) if (byId.has(id)) n += 1;
    return n;
  }, [played, byId]);

  // ── the three featured tiles ────────────────────────────────────────────
  // Each one is a real pick out of real data, and each is a quiz the hero
  // registry carries a photo for, so no slot is ever art-less.
  const feature = useMemo(() => {
    if (!byId.size) return null;
    // QUIZ OF THE DAY WAS UNPLUGGED 2026-10-09 (owner): the daily quiz pick is
    // Potluck now, a real daily on the slate (/potluck, lib/potluck.js). The
    // row keeps its other two tiles.
    const qotd = null;
    const src = (id) => { const h = heroFor(byId.get(id)); return h && h.src; };
    const qsrc = qotd ? src(qotd) : null;

    // MOST PLAYED, and it takes the DEPARTMENT hero when the quiz has none of
    // its own. The first build required a registry entry and the slot came up
    // empty on the live page: the top row was already the quiz of the day and
    // not one of the eight behind it is heroed, which is the normal case rather
    // than the unlucky one. A photo that says Geography is a true thing to put
    // on a geography quiz, and it is what the old hub did. Two tiles never
    // share an image, because the fallback would happily hand the same
    // department photo to both.
    let top = null;
    if (Array.isArray(popular)) {
      for (const row of popular) {
        if (!row || row.id === qotd || !byId.has(row.id)) continue;
        const s = src(row.id);
        if (!s || s === qsrc) continue;
        top = row.id;
        break;
      }
    }
    const tsrc = top ? src(top) : null;

    // A geo guesser, newest first. The catalogue arrives newest-first inside a
    // topic, so the first match IS the newest one.
    let geo = null;
    for (const q of byId.values()) {
      if (geo) break;
      if (!/geo guesser/i.test(q.title || '')) continue;
      if (q.id === qotd || q.id === top) continue;
      const s = src(q.id);
      if (!s || s === qsrc || s === tsrc) continue;
      geo = q.id;
    }

    return { qotd: qsrc ? qotd : null, top, geo, waiting: !popular };
  }, [byId, popular]);

  // ── search ─────────────────────────────────────────────────────────────
  const needle = query.trim().toLowerCase();
  const hits = useMemo(() => {
    if (needle.length < 2) return null;
    const out = [];
    for (const t of list) {
      for (const q of (t.quizzes || [])) {
        if (String(q.title || '').toLowerCase().includes(needle)) {
          out.push({ ...q, dept: t.id, deptLabel: t.label, i: list.indexOf(t) });
          if (out.length >= 90) return out;
        }
      }
    }
    return out;
  }, [needle, list]);

  const toggle = (id) => setOpenIds((cur) => {
    const next = new Set(cur);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const hueVars = (i) => ({
    '--cc-dk': CATEGORY_RAMP[i % CATEGORY_RAMP.length],
    '--cc-lt': CATEGORY_RAMP_LIGHT[i % CATEGORY_RAMP_LIGHT.length],
  });

  const tile = (q, i) => (
    <a
      key={q.id}
      className={'qzh-g' + (played.has(q.id) ? ' done' : '')}
      href={withTq('/quiz/' + encodeURIComponent(q.id))}
    >
      <span className="qzh-gn">{q.title}</span>
      <span className="qzh-gt">{tagOf(q) || (q.deptLabel || '')}</span>
    </a>
  );

  const feat = (id, kind, lead, waiting) => {
    const q = id ? byId.get(id) : null;
    const hero = heroFor(q);
    // THE FOOTPRINT ONLY WHILE THE READ IS OUT. Once it has landed and there is
    // still no pick, the slot is not drawn: the row is auto-fit, so two tiles
    // simply take the width. An empty plate held forever is a white slab on the
    // light register, which is what the first build shipped.
    if (!q || !hero) {
      return waiting ? <span className="qzh-feat qzh-wait" aria-hidden="true" /> : null;
    }
    return (
      <a className="qzh-feat" href={withTq('/quiz/' + encodeURIComponent(q.id))}>
        <span
          className="qzh-fimg"
          style={{ backgroundImage: `url(${hero.src})`, backgroundPosition: hero.pos || 'center' }}
        />
        <span className="qzh-fscrim" />
        <span className={'qzh-fk' + (lead ? ' now' : '')}>{kind}</span>
        <span className="qzh-fn">{q.title}</span>
        <span className="qzh-fm">{[q.deptLabel, tagOf(q)].filter(Boolean).join(' · ')}</span>
      </a>
    );
  };

  // Your best topics, off the profile the cap already read: byCategory is
  // keyed by department and carries the rank and the field, so the table is
  // free once /api/quiz/me is in.
  const mine = useMemo(() => {
    const cats = (me && me.byCategory) || null;
    if (!cats || !list.length) return [];
    return list
      .map((t) => ({ t, c: cats[t.id] }))
      .filter((r) => r.c && r.c.matches > 0)
      .sort((a, b) => (b.c.xp || 0) - (a.c.xp || 0))
      .slice(0, 6);
  }, [me, list]);

  const who = me && me.name ? me.name : null;
  const rank = me ? ((me.ranks && me.ranks.xp) || me.rank || null) : null;

  return (
    <div className="qzh stage-page" data-stage-theme={stageTheme} ref={rootRef}>
      {/* dangerouslySetInnerHTML, NOT a text child: React escapes text
          children and <style> is a raw-text element, so an apostrophe ships as
          &#x27; and the rule carrying it is dropped. A SERVER page renders this
          component, so there is no client re-render to repair it. See
          scripts/verify-inline-style-quotes.mjs. */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* 1. THE CAP. The identity, the figures, the two controls. */}
      <div className="qzh-cap">
        <div className="qzh-id">
          <a className="qzh-brand" href={withTq('/')} aria-label="Mind Loft home" title="Mind Loft">
            <MindLoftMark size={20} ink="var(--stg-ink)" accent="var(--stg-brand,#7dd3fc)" />
            <b>Mind <em>Loft</em></b>
          </a>
          <span className="qzh-here">Quizzes</span>
          {day ? <span className="qzh-date">{fmtDate(day)}</span> : null}
        </div>

        <div className="qzh-figs">
          {/* THE ROOT, NOT THIS PAGE. The sign-up surface lives on the site
              root; this link read /quizzes and got there by the 308 that this
              page replaces, so it has to name its real destination now. Same
              fix in app/today/StageToday.jsx. */}
          {meIn && !who ? (
            <a className="qzh-signup" href={withTq('/?signup=1')}>
              <b>Choose a Name</b><i>Keep Your Stats</i>
            </a>
          ) : null}
          {who ? <div className="qzh-who"><b>{who}</b><i>player</i></div> : null}
          {who && me && me.activity ? (
            <div><b>{Number(me.activity.played || 0).toLocaleString()}<i>/{total ? total.toLocaleString() : '—'}</i></b><i>played</i></div>
          ) : null}
          {who && me && me.xp != null ? (
            <div><b>{Number(me.xp).toLocaleString()}</b><i>IQ points</i></div>
          ) : null}
          {who && rank ? (
            <div><b>#{Number(rank).toLocaleString()}<i>/{Number(me.totalPlayers || 0).toLocaleString()}</i></b><i>rank</i></div>
          ) : null}
        </div>

        <a className="qzh-cx" href={withTq('/')}>Dailies</a>
        <button
          className="qzh-cx qzh-tg"
          type="button"
          onClick={() => setStageTheme(stageTheme === 'light' ? 'dark' : 'light')}
          aria-label={stageTheme === 'light' ? 'Switch to dark' : 'Switch to light'}
          title={stageTheme === 'light' ? 'Switch to dark' : 'Switch to light'}
        >
          {stageTheme === 'light' ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4.4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>
      </div>

      {/* THE CATALOGUE RAIL. What this reader has taken down, not what the day
          holds: on a page of 1,800 that is the figure that accumulates. */}
      <div className="qzh-prog">
        <span style={{ width: (total ? Math.min(100, (playedHere / total) * 100) : 0) + '%' }} />
      </div>

      <div className="qzh-wrap">
        <div className="qzh-lead">
          <h1 className="qzh-slate">
            {total ? total.toLocaleString() + ' quizzes, by topic.' : 'Quizzes, by topic.'}
          </h1>
          <label className="qzh-ask">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={total ? 'Search ' + total.toLocaleString() + ' quizzes' : 'Search the quizzes'}
              aria-label="Search the quiz catalogue"
            />
            {query ? (
              <button type="button" className="qzh-clear" onClick={() => setQuery('')} aria-label="Clear the search">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            ) : null}
          </label>
        </div>

        {/* 2. THE FEATURED ROW: the only art on the page. */}
        {!hits && feature ? (
          <div className="qzh-three qzh-rev">
            {feat(feature.top, 'Most played', true, feature.waiting)}
            {feat(feature.geo, 'Geo guesser', false, false)}
          </div>
        ) : null}

        {/* 3. THE SEARCH RESULT, when there is one, in place of the shelves. */}
        {hits ? (
          <section className="qzh-cat" style={{ '--cc-dk': 'var(--stg-ink2)', '--cc-lt': 'var(--stg-ink2)' }}>
            <div className="qzh-cathead">
              <h2>Matches</h2>
              <b>{hits.length}{hits.length >= 90 ? '+' : ''}<i> for {query.trim()}</i></b>
            </div>
            {hits.length ? (
              <div className="qzh-games">{hits.map(tile)}</div>
            ) : (
              <div className="qzh-none">Nothing by that name. Try a franchise, a decade or a country.</div>
            )}
          </section>
        ) : null}

        {/* 4. THE SHELVES. */}
        {!hits ? list.map((t, i) => {
          const open = openIds.has(t.id);
          const all = fullIds.has(t.id);
          const items = t.quizzes || [];
          const shown = all ? items : items.slice(0, PEEK);
          return (
            <section key={t.id} className="qzh-cat qzh-rev" style={hueVars(i)}>
              <div className="qzh-cathead" onClick={(e) => {
                try { if (e.target && e.target.closest && e.target.closest('a,button')) return; } catch (x) {}
                toggle(t.id);
              }}>
                <h2>{t.label}</h2>
                <b>{Number(t.count || 0).toLocaleString()}<i> quizzes</i></b>
                <a className="qzh-all" href={withTq('/quizzes/all#' + t.id)}>
                  <span>{t.label} A to Z</span>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
                </a>
                <button
                  type="button"
                  className={'qzh-cav' + (open ? ' on' : '')}
                  aria-expanded={open}
                  aria-label={open ? 'Collapse ' + t.label : 'Show ' + t.label}
                  onClick={(e) => { e.stopPropagation(); toggle(t.id); }}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                </button>
              </div>
              <div className={'qzh-games' + (open ? '' : ' shut')}>{shown.map(tile)}</div>
              {open && items.length > PEEK ? (
                <button
                  type="button"
                  className="qzh-more"
                  onClick={() => setFullIds((cur) => {
                    const next = new Set(cur);
                    if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
                    return next;
                  })}
                >
                  {all ? 'Show fewer' : 'Show all ' + Number(t.count || 0).toLocaleString()}
                </button>
              ) : null}
            </section>
          );
        }) : null}

        {/* 5. YOUR BEST TOPICS. Drawn only when there is a profile behind it. */}
        {!hits && mine.length ? (
          <section className="qzh-cat qzh-rev" style={{ '--cc-dk': 'var(--stg-ink2)', '--cc-lt': 'var(--stg-ink2)' }}>
            <div className="qzh-cathead">
              <h2>Your best topics</h2>
              <b>{Number((me.activity && me.activity.played) || 0).toLocaleString()}<i> played</i></b>
            </div>
            <table className="qzh-tbl">
              <tbody>
                {mine.map((r, i) => (
                  <tr key={r.t.id}>
                    <td className="qzh-pos">{i + 1}</td>
                    <td className="qzh-who2">
                      {r.t.label}
                      <span className="qzh-sub"> &middot; {Number(r.c.played || r.c.matches || 0).toLocaleString()} of {Number(r.t.count || 0).toLocaleString()}</span>
                    </td>
                    <td className="qzh-num">{Number(r.c.xp || 0).toLocaleString()}</td>
                    <td className="qzh-rk">#{Number(r.c.rank || 0).toLocaleString()}<i> of {Number(r.c.catTotal || 0).toLocaleString()}</i></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </div>

      <StageFooter />
    </div>
  );
}

// NO APOSTROPHES IN THIS STYLESHEET: it is a text child of a style element, so
// React escapes them. No backticks in the comments either, because the whole
// block is a template literal.
const CSS = `
.qzh{min-height:100vh;background:var(--stg-ground);color:var(--stg-ink);
  font-family:${SANS};-webkit-font-smoothing:antialiased;}
.qzh *{box-sizing:border-box;}

/* -- the cap ------------------------------------------------------------- */
.qzh-cap{display:flex;align-items:center;gap:22px;padding:11px 22px;
  border-bottom:1px solid var(--stg-line);}
.qzh-id{display:flex;align-items:baseline;gap:11px;min-width:0;}
.qzh-brand{display:flex;align-items:center;gap:8px;min-width:0;text-decoration:none;color:var(--stg-ink);}
.qzh-brand:hover{opacity:.82;}
.qzh-id b{font-size:16px;font-weight:800;letter-spacing:-0.01em;white-space:nowrap;}
.qzh-id b em{font-style:normal;color:var(--stg-brand,#7dd3fc);}
.qzh-here{font-family:${MONO};font-size:9px;letter-spacing:.11em;text-transform:uppercase;
  font-weight:500;color:var(--stg-onramp,#08222e);background:var(--stg-acc);
  border-radius:5px;padding:3px 7px;white-space:nowrap;}
.qzh-date{font-family:${MONO};font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;
  color:var(--stg-mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.qzh-figs{display:flex;align-items:center;gap:20px;margin-left:auto;}
.qzh-figs>div{text-align:right;}
.qzh-figs b{display:block;font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1.1;}
.qzh-figs b i{font-style:normal;font-weight:600;color:var(--stg-mute);font-size:12px;}
.qzh-figs>div>i{font-style:normal;font-family:${MONO};font-size:9px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--stg-mute);}
.qzh-signup{display:flex;flex-direction:column;text-decoration:none;color:var(--stg-onramp,#08222e);
  background:var(--stg-acc);border-radius:8px;padding:5px 12px;}
.qzh-signup b{font-size:13px;font-weight:800;line-height:1.2;}
.qzh-signup i{font-style:normal;font-size:11px;font-weight:700;line-height:1.2;opacity:.85;}
.qzh-cx{flex:none;font-family:${MONO};font-size:10px;letter-spacing:.11em;text-transform:uppercase;
  color:var(--stg-ink2);text-decoration:none;border:1px solid var(--stg-line);border-radius:7px;
  padding:6px 10px;background:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
.qzh-cx:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.qzh-cx:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.qzh-tg{padding:5px 8px;}
.qzh-prog{height:2px;background:var(--stg-surf2);}
.qzh-prog span{display:block;height:100%;background:var(--stg-ink2);transition:width .4s ease;}

.qzh-wrap{max-width:none;margin:0 auto;padding:22px 22px 64px;
  display:flex;flex-direction:column;gap:26px;}

/* -- the heading line, and the one control a catalogue needs -------------- */
.qzh-lead{display:flex;align-items:center;gap:22px;}
.qzh-slate{margin:0;font-size:19px;font-weight:800;letter-spacing:-.015em;line-height:1.2;color:var(--stg-ink);}
.qzh-ask{display:flex;align-items:center;gap:9px;margin-left:auto;flex:none;width:320px;
  background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:8px;padding:8px 12px;}
.qzh-ask:focus-within{border-color:var(--stg-acc);}
.qzh-ask svg{flex:none;color:var(--stg-mute);}
.qzh-ask input{flex:1 1 auto;min-width:0;background:none;border:0;outline:none;
  font-family:${SANS};font-size:13px;font-weight:600;color:var(--stg-ink);}
.qzh-ask input::placeholder{color:var(--stg-mute);font-weight:600;}
.qzh-clear{flex:none;background:none;border:0;padding:0;cursor:pointer;color:var(--stg-mute);
  display:inline-flex;}
.qzh-clear:hover{color:var(--stg-ink);}

/* -- the featured row: the only art on the page -------------------------- */
/* MATCHED TILES, not a lead and two extras: equal columns, one height, one
   label each, and no button, because the whole tile is the control exactly as
   a game tile on the daily home is. */
.qzh-three{display:grid;gap:9px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));}
/* THE ANCHOR RESET OUT-SPECIFIES A PLAIN CLASS on any page that also styles
   bare anchors, and a tile carrying its own photo owes its own ink in both
   registers. Named on the element, and the title states its colour again. */
a.qzh-feat,.qzh-feat{position:relative;display:flex;flex-direction:column;justify-content:flex-end;
  height:176px;border-radius:10px;overflow:hidden;text-decoration:none;color:#e9edf4;
  border:1px solid var(--stg-line);padding:14px 16px;isolation:isolate;}
/* The waiting plate is a HAIRLINE, not a fill: on the pale register a filled
   one is a white slab in the middle of a row of photographs. */
.qzh-wait{background:none;border-style:dashed;}
.qzh-fimg{position:absolute;inset:0;z-index:-2;background-size:cover;background-color:#101827;}
.qzh-fscrim{position:absolute;inset:0;z-index:-1;
  background:linear-gradient(180deg,rgba(11,15,26,0.22) 0%,rgba(11,15,26,0.80) 54%,rgba(11,15,26,0.95) 100%);}
a.qzh-feat:hover{border-color:var(--stg-acc);}
a.qzh-feat:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.qzh-fk{align-self:flex-start;font-family:${MONO};font-size:9px;letter-spacing:.13em;
  text-transform:uppercase;color:rgba(233,237,244,0.78);margin-bottom:8px;}
.qzh-fk.now{color:#08222e;background:#7dd3fc;border-radius:5px;padding:3px 7px;}
.qzh-fn{color:#e9edf4;font-size:18px;font-weight:800;letter-spacing:-0.015em;line-height:1.2;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.qzh-fm{margin-top:6px;font-size:11.5px;font-weight:600;color:rgba(233,237,244,0.74);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

/* -- a section ----------------------------------------------------------- */
.qzh-cat{position:relative;padding-left:16px;--cc:var(--cc-dk,var(--stg-ink2));}
[data-stage-theme=light] .qzh-cat{--cc:var(--cc-lt,var(--stg-ink2));}
.qzh-cat::before{content:'';position:absolute;left:0;top:2px;bottom:2px;width:4px;
  border-radius:2px;background:var(--cc);}
.qzh-cathead{display:flex;align-items:baseline;gap:11px;margin-bottom:10px;cursor:pointer;}
.qzh-cathead h2{margin:0;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;}
.qzh-cathead b{font-family:${MONO};font-size:12px;font-weight:700;
  font-variant-numeric:tabular-nums;color:var(--stg-ink2);}
.qzh-cathead b i{font-style:normal;color:var(--stg-mute);}
.qzh-all{display:inline-flex;align-items:center;align-self:center;gap:6px;flex:none;margin-left:auto;
  text-decoration:none;color:var(--stg-acc-ink);font-family:${MONO};font-size:9.5px;
  letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;}
.qzh-all:hover{opacity:.78;}
.qzh-all:focus-visible{outline:2px solid var(--stg-acc);outline-offset:3px;border-radius:4px;}
.qzh-cav{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;
  border:0;border-radius:7px;background:none;cursor:pointer;color:var(--stg-mute2);
  transition:transform .18s,color .12s,background .12s;}
.qzh-cathead:hover .qzh-cav{color:var(--stg-ink);background:var(--stg-chip);}
.qzh-cav.on{transform:rotate(180deg);}
.qzh-cav:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.qzh-none{color:var(--stg-mute);font-size:13px;font-weight:600;}

/* -- a quiz tile --------------------------------------------------------- */
/* THE SAME TILE THE DAILY ROSTER DEALS, with one change: a quiz title is a
   sentence where a game name is a word, so the name block is TWO LINES ON
   EVERY TILE, filled or not, and a shelf stays a grid instead of a ragged
   floor. auto-fit rather than auto-fill, because a topic peeks a dozen and
   auto-fill left the end of the row as bare ground. */
.qzh-games{display:grid;gap:7px;grid-template-columns:repeat(auto-fit,minmax(206px,1fr));}
.qzh-games.shut{display:none;}
.qzh-g{display:block;min-width:0;text-decoration:none;background:var(--stg-surf);
  border:1px solid var(--stg-line);border-radius:9px;padding:11px 12px 12px;color:var(--stg-ink);}
.qzh-g:hover{border-color:var(--cc);}
.qzh-g:focus-visible{outline:2px solid var(--cc);outline-offset:2px;}
.qzh-gn{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  height:2.56em;font-size:13.5px;font-weight:800;letter-spacing:-0.01em;line-height:1.28;}
.qzh-gt{display:block;font-size:11.5px;font-weight:600;color:var(--stg-mute);margin-top:6px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
/* Played is stated in COLOUR, not in opacity: half-strength prose on this
   ground reads at 2.4:1. The daily home settled this the same way. */
.qzh-g.done .qzh-gn{color:var(--stg-mute);}
.qzh-more{display:block;width:100%;margin-top:7px;background:var(--stg-surf);
  border:1px solid var(--stg-line);border-radius:9px;padding:9px;cursor:pointer;
  font-family:${MONO};font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-ink2);}
.qzh-more:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.qzh-more:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}

/* -- your best topics ---------------------------------------------------- */
.qzh-tbl{width:100%;max-width:760px;border-collapse:collapse;font-variant-numeric:tabular-nums;}
.qzh-tbl td{padding:7px 6px;border-bottom:1px solid var(--stg-line);font-size:13.5px;}
.qzh-tbl tr:last-child td{border-bottom:0;}
.qzh-pos{width:36px;font-family:${MONO};font-size:12px;color:var(--stg-mute);}
.qzh-who2{font-weight:700;}
.qzh-sub{color:var(--stg-mute);font-size:12.5px;font-weight:600;}
.qzh-num{width:70px;text-align:right;font-weight:800;}
.qzh-rk{width:112px;text-align:right;font-family:${MONO};font-size:12px;color:var(--stg-ink2);white-space:nowrap;}
.qzh-rk i{font-style:normal;color:var(--stg-mute);}

@media (max-width:1000px){
  .qzh-three{grid-template-columns:1fr;}
  .qzh-feat,a.qzh-feat{height:150px;}
}
@media (max-width:820px){
  .qzh-lead{flex-direction:column;align-items:stretch;gap:12px;}
  .qzh-ask{margin-left:0;width:auto;}
}
@media (max-width:640px){
  .qzh-cap{flex-wrap:wrap;gap:10px 14px;padding:10px 14px;}
  .qzh-date{display:none;}
  .qzh-figs{width:100%;margin-left:0;justify-content:space-between;gap:12px;}
  .qzh-wrap{padding:18px 14px 52px;gap:22px;}
  .qzh-games{grid-template-columns:minmax(0,1fr);}
  .qzh-rk{width:auto;}
  .qzh-rk i{display:none;}
}
@media (prefers-reduced-motion:reduce){ .qzh-cav,.qzh-prog span{transition:none;} }

/* A SECTION FADES IN AS ITS DATA LANDS, off the mount, armed only when the
   document was visible. Opacity and a 6px rise, never height. */
@keyframes qzh-in{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
[data-qzh-anim] .qzh-rev{animation:qzh-in .34s cubic-bezier(.2,.7,.3,1) both;}
@media (prefers-reduced-motion:reduce){ [data-qzh-anim] .qzh-rev{animation:none;} }
`;
