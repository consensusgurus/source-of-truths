'use client';

// THE JIGSAW PUZZLES PORTAL, the client half of /jig/shelf (owner, 2026-11-21:
// "make the site the top destination for jigsaw puzzles ... maybe it's more of
// a grid of available images", then "can't we have the piece selector be
// shared on page", "why can't piece count go higher up to mural count", and
// "if it doesn't work on larger sizes, make it unavailable ... Greyed").
// It replaced the wooden Jigsaw Puzzle Shelf at the same URL, so every link to
// the shelf (footer, home lists, the Jig, Saw and Mural pages) lands here.
// Design: the "Jigsaw Portal Mockup" canvas.
//
// ALL PUZZLES: every past Jig and Saw photo as a big picture. One shared size
// bar (lib/jigsaw-sizes.js) sets the size every picture opens at; a picture
// that cannot do that size (lib/jigsaw-fit.js, read through /api/jigsaw/fit)
// is greyed with the biggest size it can do. The daily's own size opens the
// ordinary archived board; any other size opens the free-play board (/jig/big).
// DAILY ARCHIVE: the dailies as they ran, numbered and dated, with this
// device's solved marks. MURALS: finished Murals to build alone. KIDS: a door.
//
// SERVER HTML IS THE CRAWL PATH: the first render is the All Puzzles grid at
// the default size, every picture a real link to its own page (/jig?p=N,
// /saw?p=N) with alt text naming the photo. Nothing that needs this device
// (saved sizes, marks, greying) changes a link until after hydration.
//
// TODAY'S PHOTOS NEVER LEAVE THE SERVER: today's boards arrive as a number and
// a cut only, and the library holds past photos alone.
import { useEffect, useMemo, useState } from 'react';
import CircuitFrame from '../../circuits/CircuitFrame';
import { fetchDayStatus } from '../../useDayStats';
import { migrateJigSaves } from '@/lib/jig-renum';
import { gameColor, softGround } from '@/lib/category-ramp';
import {
  JIGSAW_SIZES, PHONE_SIZES, ALWAYS_OK, DEFAULT_SIZE, SIZE_KEY, DONE_KEY,
  sizeLabel, shortSize, cutFor, ownSize, playHref, freeId,
} from '@/lib/jigsaw-sizes';

const JIG_HUE = softGround(gameColor('jig'));
const GNAME = { jig: 'Jig', saw: 'Saw' };
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const atNoon = (iso) => new Date(iso + 'T12:00:00Z');
const shortDate = (iso) => { const d = atNoon(iso); return `${DOW[d.getUTCDay()]}, ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`; };
const quizIdOf = (g, iso) => { const d = atNoon(iso); return `${g}-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`; };
const thumb = (b, w) => `/api/${b.g}/img?n=${b.n}&w=${w}`;
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const readJSON = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };

const TABS = [['all', 'All Puzzles'], ['daily', 'Daily Archive'], ['murals', 'Murals'], ['kids', 'Kids']];

export default function ShelfClient({ boards, today, crumb, faq, topics = [], allTopics = [] }) {
  const todays = boards.filter((b) => b.today);
  const past = useMemo(() => boards.filter((b) => !b.today), [boards]);

  const [tab, setTab] = useState('all');
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [shape, setShape] = useState('both');
  const [topic, setTopic] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('new');
  const [hideOff, setHideOff] = useState(false);
  const [dailyFilter, setDailyFilter] = useState('all');
  const [fit, setFit] = useState(null);       // { 'jig-12': 2000 } once measured
  const [hydrated, setHydrated] = useState(false);
  const [store, setStore] = useState({ done: {}, saves: {} });
  const [marks, setMarks] = useState({ solved: new Set(), played: new Set(), open: new Set(), ready: false });
  const [murals, setMurals] = useState(null);

  // The reader's size, and the links that land on a tab (?g=saw from Saw's
  // board, ?tab=murals from a finished Mural). Read after mount so the server
  // HTML and the first client render agree.
  useEffect(() => {
    let s = Number(readJSON(SIZE_KEY));
    if (!JIGSAW_SIZES.includes(s)) s = DEFAULT_SIZE;
    try { if (window.matchMedia('(max-width: 640px)').matches && !PHONE_SIZES.includes(s)) s = PHONE_SIZES.reduce((a, x) => (Math.abs(x - s) < Math.abs(a - s) ? x : a), PHONE_SIZES[0]); } catch (e) {}
    setSize(s);
    try {
      const sp = new URLSearchParams(window.location.search);
      const g = sp.get('g'), t = sp.get('tab');
      if (g === 'saw' || g === 'jig') { setTab('daily'); setDailyFilter(g); }
      if (t && TABS.some(([k]) => k === t)) setTab(t);
    } catch (e) {}
    setHydrated(true);
  }, []);
  const pickSize = (s) => { setSize(s); try { localStorage.setItem(SIZE_KEY, JSON.stringify(s)); } catch (e) {} };
  const pickTab = (t) => {
    setTab(t);
    try { const u = new URL(window.location.href); if (t === 'all') u.searchParams.delete('tab'); else u.searchParams.set('tab', t); u.searchParams.delete('g'); window.history.replaceState(null, '', u.toString()); } catch (e) {}
  };

  // Which sizes each photo can do.
  useEffect(() => {
    let alive = true;
    fetch('/api/jigsaw/fit').then((r) => r.json()).then((d) => { if (alive && d && d.max) setFit(d.max); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // This device's free-play saves and finished sizes, and the dailies' saves.
  useEffect(() => {
    migrateJigSaves();
    const done = readJSON(DONE_KEY) || {};
    const saves = {};
    const solved = new Set(), played = new Set(), open = new Set();
    for (const b of boards) {
      const sv = readJSON(`sot_${b.g}_${b.n}`);
      if (sv && typeof sv === 'object') {
        if (sv.status === 'won') { solved.add(b.k); played.add(b.k); }
        else if (sv.status && sv.status !== 'playing') played.add(b.k);
        else if (sv.t0) saves[`${b.k}-own`] = 1;
        if (b.today && sv.status && sv.status !== 'playing') open.add(b.k);
      }
      if (b.today) continue;
      for (const s of JIGSAW_SIZES) {
        const fs = readJSON(`mural_solo_${freeId(b.g, b.n, s)}`);
        if (fs && Array.isArray(fs.pieces) && fs.pieces.length) {
          const cut = cutFor(s, b.c, b.r);
          saves[`${b.k}-${s}`] = Math.min(99, Math.max(1, Math.floor((fs.pieces.length / (cut.cols * cut.rows)) * 100)));
        }
      }
    }
    setStore({ done, saves });
    setMarks({ solved, played, open, ready: true });
    const byQuiz = new Map(boards.map((b) => [quizIdOf(b.g, b.d), b.k]));
    let alive = true;
    fetchDayStatus().then((d) => {
      if (!alive || !d) return;
      const s2 = new Set(solved), p2 = new Set(played);
      const take = (list, set) => { for (const q of list || []) { const k = byQuiz.get(q); if (k) set.add(k); } };
      take(d.played, p2); take(d.completed, p2); take(d.completed, s2);
      setMarks({ solved: s2, played: p2, open, ready: true });
    }).catch(() => {});
    return () => { alive = false; };
  }, [boards]);

  useEffect(() => {
    if (tab !== 'murals' || murals) return undefined;
    let alive = true;
    fetch('/api/mural/shelf').then((r) => r.json())
      .then((d) => { if (alive) setMurals(Array.isArray(d && d.murals) ? d.murals : []); })
      .catch(() => { if (alive) setMurals([]); });
    return () => { alive = false; };
  }, [tab, murals]);

  // ---- the library at the chosen size ----
  const maxOf = (b) => (fit ? (fit[b.k] || ALWAYS_OK) : Infinity);
  const canDo = (b, s) => s <= ALWAYS_OK || maxOf(b) >= s;
  const isOwn = (b, s) => s === ownSize(b.c, b.r);
  const doneAt = (b, s) => (isOwn(b, s) ? marks.solved.has(b.k) : !!store.done[`${b.k}-${s}`]);
  const resumeAt = (b, s) => (isOwn(b, s) ? (store.saves[`${b.k}-own`] ? 'own' : 0) : (store.saves[`${b.k}-${s}`] || 0));

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    return past.filter((b) => (shape === 'both' || (shape === 'tall' ? b.g === 'saw' : b.g === 'jig'))
      && (topic === 'all' || b.topic === topic)
      && (!q || fold(b.name).includes(q)));
  }, [past, shape, topic, query]);
  const sorted = useMemo(() => {
    const a = filtered.slice();
    if (sort === 'old') a.reverse();
    else if (sort === 'todo') a.sort((x, y) => (doneAt(x, size) === doneAt(y, size) ? 0 : doneAt(x, size) ? 1 : -1));
    else if (sort === 'big') a.sort((x, y) => maxOf(y) - maxOf(x));
    return a;
  }, [filtered, sort, size, fit, store, marks]); // eslint-disable-line react-hooks/exhaustive-deps
  const okCount = filtered.filter((b) => canDo(b, size)).length;
  const shown = hideOff ? sorted.filter((b) => canDo(b, size)) : sorted;
  const topicN = (slug) => past.filter((b) => (shape === 'both' || (shape === 'tall' ? b.g === 'saw' : b.g === 'jig')) && (slug === 'all' || b.topic === slug)).length;

  const dailyList = useMemo(() => boards.filter((b) => (dailyFilter === 'jig' || dailyFilter === 'saw' ? b.g === dailyFilter
    : dailyFilter === 'solved' ? marks.solved.has(b.k)
      : dailyFilter === 'unplayed' ? !marks.played.has(b.k)
        : dailyFilter === 'sun' ? !!b.s : true)), [boards, dailyFilter, marks]);

  const clearFilters = () => { setShape('both'); setTopic('all'); setQuery(''); setHideOff(false); };

  return (
    <CircuitFrame cat="Visual" label="Jigsaw puzzles" wide bar={{ title: 'Jigsaw Puzzles', sub: 'Free photo jigsaws', dot: JIG_HUE }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <nav className="jp-crumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span aria-hidden="true">/</span>
        {crumb ? <><a href={crumb.href}>{crumb.label}</a><span aria-hidden="true">/</span></> : null}
        <span aria-current="page">Jigsaw Puzzles</span>
      </nav>

      <header className="jp-head">
        <div className="jp-htx">
          <h1>Jigsaw Puzzles</h1>
          <p className="jp-lede">
            Free online jigsaw puzzles made from real photographs: {past.length} pictures so far, each one playable at 24 to 4,000 pieces.
            Pick a size once, then pick a picture. No download, no signup, and a new Jig and Saw every day.
          </p>
        </div>
        <div className="jp-today" aria-label="Today">
          {todays.map((b) => (
            <a key={b.k} className="jp-tbtn" href={`/${b.g}`}>
              <span className={`jp-tq${b.g === 'saw' ? ' tall' : ''}`} aria-hidden="true">?</span>
              <span><b>Today&apos;s {GNAME[b.g]}</b><small>{marks.solved.has(b.k) ? 'Solved' : `Ranked, ${b.c * b.r} pieces`}</small></span>
            </a>
          ))}
          <a className="jp-tbtn" href="/mural">
            <span className="jp-tq jp-tm" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg></span>
            <span><b>Mural</b><small>4,000 pieces, built together</small></span>
          </a>
        </div>
      </header>

      <nav className="jp-tabs" aria-label="Jigsaw sections">
        {TABS.map(([k, lab]) => (
          <a key={k} href={k === 'all' ? '/jig/shelf' : `/jig/shelf?tab=${k}`} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined}
            onClick={(e) => { e.preventDefault(); pickTab(k); }}>
            {lab}{k === 'all' ? <b>{past.length}</b> : k === 'daily' ? <b>{boards.length}</b> : null}
          </a>
        ))}
      </nav>

      {tab === 'all' ? (
        <>
          <div className="jp-ctl">
            <div className="jp-grp">
              <span className="jp-lab" id="jp-plab">Pieces</span>
              <div className="jp-seg jp-sizes" role="group" aria-labelledby="jp-plab">
                {JIGSAW_SIZES.map((s) => (
                  <button key={s} type="button" className={`${size === s ? 'on' : ''}${PHONE_SIZES.includes(s) ? '' : ' jp-nophone'}`} aria-pressed={size === s}
                    aria-label={`${sizeLabel(s)} pieces`} onClick={() => pickSize(s)}>
                    <span className="jp-long">{sizeLabel(s)}</span><span className="jp-short">{shortSize(s)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="jp-grp">
              <span className="jp-lab" id="jp-slab">Shape</span>
              <div className="jp-seg sm" role="group" aria-labelledby="jp-slab">
                {[['both', 'Both'], ['wide', 'Wide'], ['tall', 'Tall']].map(([k, lab]) => (
                  <button key={k} type="button" className={shape === k ? 'on' : ''} aria-pressed={shape === k} onClick={() => setShape(k)}>{lab}</button>
                ))}
              </div>
            </div>
            <span className="jp-sp" />
            <select className="jp-sel" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort the pictures">
              <option value="new">Newest</option>
              <option value="old">Oldest</option>
              <option value="todo">Not done at this size</option>
              <option value="big">Best for big sizes</option>
            </select>
          </div>

          <div className="jp-row2">
          <div className="jp-topics" role="group" aria-label="Topic">
            <button type="button" className={topic === 'all' ? 'on' : ''} aria-pressed={topic === 'all'} onClick={() => setTopic('all')}>All <b>{topicN('all')}</b></button>
            {allTopics.map((t) => (
              <button key={t.slug} type="button" className={topic === t.slug ? 'on' : ''} aria-pressed={topic === t.slug} onClick={() => setTopic(t.slug)}>{t.label} <b>{topicN(t.slug)}</b></button>
            ))}
          </div>
            <span className="jp-sp" />
            <label className="jp-search">
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Dogs, Venice, waterfalls" aria-label="Search the jigsaw pictures" />
            </label>
          </div>

          {size > ALWAYS_OK ? (
            <p className="jp-avail" aria-live="polite">
              <span><b>{sizeLabel(size)} pieces:</b> {fit ? `${okCount} of these ${filtered.length} pictures have the detail for it. The rest show the biggest size they can do.` : 'Checking which pictures have the detail for it.'}</span>
              <label className="jp-chk"><input type="checkbox" checked={hideOff} onChange={(e) => setHideOff(e.target.checked)} />Hide pictures that can&apos;t</label>
            </p>
          ) : null}

          {shown.length ? (
            <ul className="jp-grid" aria-label={`Jigsaw puzzles at ${sizeLabel(size)} pieces`}>
              {shown.map((b, i) => {
                const ok = canDo(b, size);
                const done = hydrated && doneAt(b, size);
                const res = hydrated && !done ? resumeAt(b, size) : 0;
                const inner = (
                  <>
                    <span className="jp-ph">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb(b, 500)} alt={`${b.name}, ${b.g === 'saw' ? 'tall ' : ''}jigsaw puzzle`} width="500" height="333"
                        loading={i < 6 ? 'eager' : 'lazy'} decoding="async" />
                      {b.g === 'saw' ? <span className="jp-bd tall">Tall</span> : null}
                      {!ok ? <span className="jp-bd max">Up to {sizeLabel(maxOf(b))}</span>
                        : done ? <span className="jp-bd done"><svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2l2.3 2.3 4.7-4.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>Done at {sizeLabel(size)}</span>
                          : res ? <span className="jp-bd res">{res === 'own' ? 'In progress' : `Resume ${res}%`}</span> : null}
                    </span>
                    <span className="jp-cap">{b.name}</span>
                  </>
                );
                return (
                  <li key={b.k}>
                    {ok ? (
                      <a className="jp-card" href={hydrated ? playHref(b, size) : `/${b.g}?p=${b.n}`}
                        aria-label={`${b.name}: play it as a ${sizeLabel(size)} piece jigsaw${done ? ', done at this size' : ''}`}>{inner}</a>
                    ) : (
                      <div className="jp-card off" aria-disabled="true" title={`This picture goes up to ${sizeLabel(maxOf(b))} pieces`}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="jp-none">
              <p>No pictures match. Try another word or topic.</p>
              <button type="button" onClick={clearFilters}>Clear filters</button>
            </div>
          )}
          <p className="jp-note">
            Every size is free play. The daily&apos;s own size opens that day&apos;s board; any other size opens on the big table, where your progress is saved in this browser. Today&apos;s pictures join the library tomorrow.
          </p>
        </>
      ) : null}

      {tab === 'daily' ? (
        <section aria-label="Every daily jigsaw">
          <p className="jp-mlede">Every Jig and Saw as it ran: Jig is an 80 piece wide photo, Saw a tall one whose pieces lock to each other. Today&apos;s two stay a surprise until you play them.</p>
          <div className="jp-topics" role="group" aria-label="Show">
            {[['all', 'All'], ['jig', 'Jig'], ['saw', 'Saw'], ['solved', 'Solved'], ['unplayed', 'Not played'], ['sun', 'Sundays']].map(([k, lab]) => (
              <button key={k} type="button" className={dailyFilter === k ? 'on' : ''} aria-pressed={dailyFilter === k} onClick={() => setDailyFilter(k)}>{lab}</button>
            ))}
          </div>
          <ul className="jp-grid daily">
            {dailyList.map((b) => {
              const solved = marks.solved.has(b.k);
              const shut = b.today && !marks.open.has(b.k);
              return (
                <li key={b.k}>
                  <a className="jp-card" href={b.today ? `/${b.g}` : `/${b.g}?p=${b.n}`}>
                    <span className="jp-ph">
                      {shut ? <span className="jp-q">?</span>
                        // eslint-disable-next-line @next/next/no-img-element
                        : <img src={thumb(b, 500)} alt={b.today ? `Today's ${GNAME[b.g]}` : `${b.name}, ${GNAME[b.g]} No. ${b.n}`} width="500" height="333" loading="lazy" decoding="async" />}
                      {solved ? <span className="jp-bd done">Solved</span> : b.today ? <span className="jp-bd res">Today</span> : null}
                    </span>
                    <span className="jp-cap">{b.today ? `Today's ${GNAME[b.g]}` : b.name}</span>
                    <span className="jp-sub">{GNAME[b.g]} No. {b.n} · {shortDate(b.d)} · {b.c * b.r} pieces{b.s ? ' · Sunday' : ''}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {tab === 'murals' ? (
        <section aria-label="Finished murals">
          <p className="jp-mlede">
            Mural and MuralToo are 4,000 piece jigsaws the whole site builds together. Once one is finished or its day is over, it comes here to build alone: no points, no clock, and your pieces are kept on this device.
            {' '}<a href="/mural">Play Mural</a> while it is open, or <a href="/mural/private">start a Private Mural</a> for your group.
          </p>
          {murals === null ? <p className="jp-mnone">Loading the murals.</p> : !murals.length ? (
            <p className="jp-mnone">No mural has finished yet. The first one lands here when its last piece is placed.</p>
          ) : (
            <ul className="jp-grid">
              {murals.map((m) => (
                <li key={m.id}>
                  <a className="jp-card" href={`${m.route}?solo=${m.id}`}>
                    <span className="jp-ph">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/mural/img?id=${m.id}&w=960${m.pv ? `&v=${m.pv}` : ''}`} alt={m.title || `${m.name}, ${m.date}`} loading="lazy" />
                      <span className="jp-bd res">{(m.total || 4000).toLocaleString('en-US')}</span>
                    </span>
                    <span className="jp-cap">{m.title || m.name}</span>
                    <span className="jp-sub">{m.name} · {m.date} · {m.complete ? 'Finished by the crowd' : `${m.placed.toLocaleString('en-US')} placed before it closed`}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === 'kids' ? (
        <section aria-label="Kids jigsaws" className="jp-kids">
          <p className="jp-mlede">The same photographs for younger players, cut into 6 to 30 big pieces that snap into place. Nothing is scored.</p>
          <a className="jp-kbtn" href="/kids/jigsaw">Open the kids jigsaws</a>
        </section>
      ) : null}

      {topics.length ? (
        <nav className="jp-more" aria-label="Jigsaw puzzles by topic">
          <h2>Jigsaw puzzles by topic</h2>
          <div>
            {topics.map((t) => <a key={t.slug} href={t.href}>{t.label} jigsaw puzzles <b>{t.count}</b></a>)}
            <a href="/mural">4,000 piece Mural</a>
            <a href="/kids/jigsaw">Kids jigsaws</a>
          </div>
        </nav>
      ) : null}

      <section className="jp-faq" aria-label="Questions">
        {faq.map((f) => (
          <div className="jp-qa" key={f.q}>
            <h2>{f.q}</h2>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      <p className="jp-foot">
        {past.length} jigsaw pictures so far, with a new Jig and a new Saw every day at midnight Eastern.
        Every photo is a featured picture from <a href="https://commons.wikimedia.org/" rel="noopener">Wikimedia Commons</a>, credited when you finish it.
        Looking for another game? The <a href="/archive">puzzle archive</a> has every past board of every daily.
      </p>
    </CircuitFrame>
  );
}

// A JS template literal: no backticks inside, and no apostrophes either (the
// escaping trap CircuitFrame describes). Colours are page tokens, plus the
// site pastel for the selected state, which carries near-black ink in both
// registers.
const CSS = `
:root{--jp-hue:${JIG_HUE};--jp-ink:#0b0d12;}
.jp-crumb{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12.5px;font-weight:700;color:var(--stg-mute);margin-bottom:12px;}
.jp-crumb a{color:var(--stg-ink2);text-decoration:none;}
.jp-crumb a:hover{color:var(--stg-ink);text-decoration:underline;}
.jp-crumb span[aria-current]{color:var(--stg-ink);}
.jp-head{display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:18px;}
.jp-htx{flex:1 1 420px;min-width:0;}
.jp-head h1{margin:0;font-size:34px;line-height:1.15;font-weight:800;letter-spacing:-0.02em;color:var(--stg-ink);}
.jp-lede{margin:8px 0 0;max-width:640px;font-size:15px;line-height:1.55;font-weight:600;color:var(--stg-ink2);}
.jp-today{display:flex;gap:10px;flex-wrap:wrap;}
.jp-tbtn{display:flex;align-items:center;gap:10px;padding:8px 14px 8px 8px;min-height:58px;box-sizing:border-box;border:1px solid var(--stg-ink);border-radius:12px;background:var(--stg-surf);color:var(--stg-ink);text-decoration:none;}
.jp-tbtn:hover{background:var(--stg-surf2);}
.jp-tbtn b{display:block;font-size:14px;font-weight:800;line-height:1.3;}
.jp-tbtn small{display:block;font-size:12px;font-weight:700;line-height:1.35;color:var(--stg-mute);}
.jp-tq{flex:none;width:54px;height:40px;border-radius:7px;background:var(--jp-hue);color:var(--jp-ink);border:1px solid var(--jp-ink);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;}
.jp-tq.tall{width:32px;height:44px;}
.jp-tabs{display:flex;gap:24px;border-bottom:1px solid var(--stg-line);margin-bottom:14px;overflow-x:auto;}
.jp-tabs a{flex:none;display:flex;align-items:center;gap:6px;font-size:15px;font-weight:800;color:var(--stg-mute);text-decoration:none;padding:4px 0 11px;border-bottom:3px solid transparent;margin-bottom:-1px;}
.jp-tabs a b{font-size:12px;font-weight:800;color:var(--stg-mute);}
.jp-tabs a.on{color:var(--stg-ink);border-bottom-color:var(--stg-ink);}
.jp-tabs a:hover{color:var(--stg-ink);}
.jp-ctl{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:10px 0;margin-bottom:10px;background:var(--stg-ground);border-bottom:1px solid var(--stg-line);}
.jp-grp{display:flex;align-items:center;gap:10px;}
.jp-lab{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--stg-mute);}
.jp-seg{display:flex;border:1px solid var(--stg-ink);border-radius:10px;overflow:hidden;background:var(--stg-surf);}
.jp-seg button{font:inherit;font-size:14px;font-weight:800;padding:0 14px;height:44px;border:0;border-right:1px solid var(--stg-ink);border-radius:0;background:transparent;color:var(--stg-ink);cursor:pointer;}
.jp-seg button:last-child{border-right:0;}
.jp-seg button.on{background:var(--jp-hue);color:var(--jp-ink);}
.jp-seg button:focus-visible{outline:3px solid var(--stg-ink);outline-offset:-3px;}
.jp-seg.sm button{font-size:13px;height:40px;padding:0 12px;}
.jp-short{display:none;}
.jp-sp{flex:1;}
.jp-search{display:flex;align-items:center;gap:8px;height:40px;padding:0 12px;border:1px solid var(--stg-line);border-radius:10px;background:var(--stg-surf);color:var(--stg-mute);width:240px;box-sizing:border-box;}
.jp-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:14px;font-weight:600;color:var(--stg-ink);}
.jp-sel{font:inherit;font-size:13px;font-weight:800;height:40px;padding:0 10px;border:1px solid var(--stg-line);border-radius:10px;background:var(--stg-surf);color:var(--stg-ink);}
.jp-row2{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:4px 0 14px;}
.jp-row2 .jp-topics{margin:0;}
.jp-topics{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 14px;}
.jp-topics button{font:inherit;font-size:13px;font-weight:800;padding:0 13px;height:36px;border-radius:999px;border:1px solid var(--stg-line);background:var(--stg-surf);color:var(--stg-ink2);cursor:pointer;}
.jp-topics button b{font-weight:800;color:var(--stg-mute);margin-left:3px;}
.jp-topics button:hover{border-color:var(--stg-ink);color:var(--stg-ink);}
.jp-topics button.on{background:var(--stg-ink);color:var(--stg-ground);border-color:var(--stg-ink);}
.jp-topics button.on b{color:inherit;opacity:.7;}
.jp-avail{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 14px;font-size:14px;line-height:1.5;font-weight:600;color:var(--stg-ink2);}
.jp-avail b{font-weight:800;color:var(--stg-ink);}
.jp-chk{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--stg-ink2);cursor:pointer;}
.jp-chk input{width:18px;height:18px;accent-color:var(--stg-ink);}
.jp-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px 20px;}
.jp-card{display:flex;flex-direction:column;gap:8px;color:var(--stg-ink);text-decoration:none;height:100%;}
.jp-ph{position:relative;display:block;aspect-ratio:3/2;border-radius:12px;overflow:hidden;border:1px solid var(--stg-ink);background:var(--stg-surf2);}
.jp-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transition:transform .25s ease;}
a.jp-card:hover .jp-ph img{transform:scale(1.03);}
a.jp-card:focus-visible{outline:3px solid var(--stg-ink);outline-offset:4px;border-radius:12px;}
.jp-cap{font-size:15px;font-weight:700;line-height:1.45;padding:0 2px;}
.jp-sub{font-size:12.5px;font-weight:700;line-height:1.4;color:var(--stg-mute);padding:0 2px;margin-top:-4px;}
.jp-bd{position:absolute;display:flex;align-items:center;gap:4px;font-size:12px;font-weight:800;line-height:1.3;padding:5px 9px;border-radius:7px;border:1px solid var(--jp-ink);background:#ffffff;color:var(--jp-ink);}
.jp-bd.done{right:10px;top:10px;background:var(--jp-hue);}
.jp-bd.res{right:10px;top:10px;background:var(--jp-ink);color:#ffffff;}
.jp-bd.tall{left:10px;top:10px;}
.jp-bd.max{left:50%;top:50%;transform:translate(-50%,-50%);font-size:13px;padding:7px 12px;white-space:nowrap;}
.jp-card.off{cursor:default;}
.jp-card.off img{filter:grayscale(1);opacity:.4;}
.jp-card.off .jp-cap{color:var(--stg-mute);}
.jp-q{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:800;color:var(--jp-ink);background:var(--jp-hue);}
.jp-none{padding:30px 0;text-align:center;}
.jp-none p{margin:0 0 12px;font-size:15px;font-weight:700;color:var(--stg-ink2);}
.jp-none button,.jp-kbtn{font:inherit;font-size:14px;font-weight:800;min-height:44px;padding:0 22px;border-radius:12px;border:1px solid var(--stg-ink);background:var(--stg-surf);color:var(--stg-ink);cursor:pointer;display:inline-flex;align-items:center;text-decoration:none;}
.jp-note{margin:20px 0 0;font-size:13.5px;line-height:1.55;font-weight:600;color:var(--stg-mute);max-width:760px;}
.jp-mlede{max-width:760px;margin:0 0 16px;font-size:15px;line-height:1.55;font-weight:600;color:var(--stg-ink2);}
.jp-mlede a{color:var(--stg-ink);font-weight:800;}
.jp-mnone{font-size:15px;font-weight:700;color:var(--stg-mute);padding:24px 0;}
.jp-kids{padding-bottom:8px;}
.jp-more{margin-top:40px;padding-top:24px;border-top:1px solid var(--stg-line);}
.jp-more h2{margin:0 0 10px;font-size:18px;font-weight:800;color:var(--stg-ink);}
.jp-more div{display:flex;flex-wrap:wrap;gap:8px;}
.jp-more a{font-size:13px;font-weight:800;padding:9px 13px;border-radius:999px;background:var(--stg-surf);color:var(--stg-ink2);border:1px solid var(--stg-line);text-decoration:none;}
.jp-more a:hover{border-color:var(--stg-ink);color:var(--stg-ink);}
.jp-more a b{font-weight:800;color:var(--stg-mute);margin-left:3px;}
.jp-faq{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:26px;}
.jp-qa{padding:16px 18px;border-radius:12px;background:var(--stg-surf);border:1px solid var(--stg-line);}
.jp-qa h2{margin:0;font-size:16px;line-height:1.35;font-weight:800;color:var(--stg-ink);}
.jp-qa p{margin:6px 0 0;font-size:14px;line-height:1.5;font-weight:600;color:var(--stg-ink2);}
.jp-foot{margin:22px 0 0;font-size:13.5px;line-height:1.55;font-weight:600;color:var(--stg-mute);max-width:760px;}
.jp-foot a{color:var(--stg-ink2);}
@media (max-width:1100px){.jp-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.jp-faq{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media (max-width:900px){.jp-row2 .jp-search{width:100%;}.jp-row2 .jp-sp{display:none;}.jp-row2 .jp-topics{width:100%;}}
@media (max-width:640px){
  .jp-head h1{font-size:26px;}
  .jp-lede{font-size:14px;}
  .jp-today{width:100%;}
  .jp-tbtn{flex:1 1 0;flex-direction:column;gap:5px;padding:8px 4px;text-align:center;min-width:0;}
  .jp-tbtn small{display:none;}
  .jp-tbtn b{font-size:12.5px;}
  .jp-tabs{gap:18px;}
  .jp-tabs a{font-size:14px;}
  .jp-ctl{gap:10px;}
  .jp-grp{width:100%;}
  .jp-seg{flex:1;}
  .jp-seg button{flex:1;padding:0;font-size:14px;}
  .jp-nophone{display:none;}
  .jp-long{display:none;}
  .jp-short{display:inline;}
  .jp-sel{flex:1;}
  .jp-topics{flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px;}
  .jp-topics button{flex:none;}
  .jp-grid{grid-template-columns:minmax(0,1fr);gap:18px;}
  .jp-grid.daily{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 10px;}
  .jp-grid.daily .jp-cap{font-size:13px;}
  .jp-faq{grid-template-columns:minmax(0,1fr);}
}
@media (prefers-reduced-motion:reduce){.jp-ph img{transition:none;}a.jp-card:hover .jp-ph img{transform:none;}}
`;
