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
//
// THE PUZZLE TABLE (owner, 2026-11-21, from the "Jigsaw Portal Mockup (the
// puzzle table)" canvas: "both should be more unique, ok to break from main
// theme", then "Jigsaw page looks good - how about default dark but also light
// dark toggle"). Its own look, off the site palette: a dark walnut table by
// default (a paper one in Light, the reader's pick kept in LOOK_KEY), the
// newest picture big at the top, one size ladder whose cells draw the grid
// getting finer, and the chosen size's cut lines drawn over every picture.
// The page sets the stage tokens (--stg-*) on its own root, so every part
// below, the site footer included, wears the table.
import { useEffect, useMemo, useState } from 'react';
import StageTopBar from '../../StageTopBar';
import StageFooter from '../../StageFooter';
import { useStageChrome } from '../../GauntletScreens';
import { fetchDayStatus } from '../../useDayStats';
import { migrateJigSaves } from '@/lib/jig-renum';
import { focusStyle } from '@/lib/photo-focus';
import AddToHome from '../../AddToHome';
import { MINE_KEY, imgSrc, PHOTO_TOPICS, topicLabel } from '@/lib/photo-puzzle-shared';
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

// PLAY TOGETHER (owner, 2026-11-22: "in the Mural wiring we have the option to
// create a private group to work on a puzzle. can we do that in the jigsaw shelf
// too?"). A wide (Jig) picture opens the Private Mural start page with itself
// and a size chosen; the private cuts are 640, 1,000, 1,960 and 4,000, so the
// shelf's size rounds up to the nearest one, held to what the photo can do.
const TOGETHER = [['s', 640], ['m', 1000], ['l', 1960], ['xl', 4000]];
function togetherKey(size, max) {
  const fits = TOGETHER.filter(([, n]) => n <= max);
  const up = TOGETHER.find(([, n]) => n >= size) || TOGETHER[TOGETHER.length - 1];
  if (!fits.length || up[1] <= max) return up[0];
  return fits[fits.length - 1][0];
}

// YOUR PHOTO JIGSAWS (owner, 2026-11-27): Community Photos (players' photos, each approved by the
// owner first) and Your Photos (this device's own uploads, with their private links).
const TABS = [['all', 'All Puzzles'], ['community', 'Community Photos'], ['yours', 'Your Photos'], ['daily', 'Daily Archive'], ['murals', 'Murals'], ['kids', 'Kids']];
const LOOK_KEY = 'sot_jigsaw_look';
const TABLE = {
  dark: { ground: '#16120e', ink: '#f4ead8', ink2: 'rgba(244,234,216,.82)', mute: 'rgba(244,234,216,.6)', surf: '#211b15', surf2: '#2b241c', line: 'rgba(244,234,216,.16)', cut: 'rgba(255,255,255,.34)' },
  light: { ground: '#f6f0e4', ink: '#1c1712', ink2: 'rgba(28,23,18,.8)', mute: 'rgba(28,23,18,.58)', surf: '#ece3d3', surf2: '#e2d7c4', line: 'rgba(28,23,18,.15)', cut: 'rgba(255,255,255,.5)' },
};
// One set of cut lines per size, drawn over a 4:3 card (seeded, so the server
// and the browser draw the same tabs). Past `cap` the lines would only grey the
// photo, so the drawing stops getting finer there.
function cutPath(size, cap = 500, W = 300, H = 225) {
  const n = Math.min(size, cap);
  const cols = Math.max(2, Math.round(Math.sqrt(n * 1.5))), rows = Math.max(2, Math.round(n / cols));
  const cw = W / cols, ch = H / rows, t = Math.min(cw, ch) * 0.2;
  let seed = size * 7919 + 13;
  const coin = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 < 0.5 ? 1 : 0; };
  const out = [];
  for (let i = 1; i < cols; i++) {
    let p = `M${(i * cw).toFixed(1)} 0`;
    for (let j = 0; j < rows; j++) { const y = j * ch; p += `V${(y + ch * 0.38).toFixed(1)}a${t.toFixed(1)} ${t.toFixed(1)} 0 1 ${coin()} 0 ${(ch * 0.24).toFixed(1)}V${(y + ch).toFixed(1)}`; }
    out.push(p);
  }
  for (let j = 1; j < rows; j++) {
    let p = `M0 ${(j * ch).toFixed(1)}`;
    for (let i = 0; i < cols; i++) { const x = i * cw; p += `H${(x + cw * 0.38).toFixed(1)}a${t.toFixed(1)} ${t.toFixed(1)} 0 1 ${coin()} ${(cw * 0.24).toFixed(1)} 0H${(x + cw).toFixed(1)}`; }
    out.push(p);
  }
  return out.join('');
}
const Cuts = ({ d, vb = '0 0 300 225' }) => <svg className="jp-cut" viewBox={vb} preserveAspectRatio="none" aria-hidden="true"><path d={d} /></svg>;
// The ladder's little grid: finer as the size grows.
function SizeIcon({ s }) {
  const k = { 24: 3, 48: 4, 80: 5, 150: 6, 300: 7, 500: 8, 1000: 10, 2000: 12, 4000: 14 }[s] || 6;
  const r = Math.max(2, Math.round(k * 0.7));
  return (
    <svg className="jp-ico" viewBox="0 0 24 18" aria-hidden="true">
      <rect x=".5" y=".5" width="23" height="17" rx="2" />
      {Array.from({ length: k - 1 }, (_, i) => <line key={`c${i}`} x1={((i + 1) * 24) / k} y1="0" x2={((i + 1) * 24) / k} y2="18" />)}
      {Array.from({ length: r - 1 }, (_, i) => <line key={`r${i}`} x1="0" y1={((i + 1) * 18) / r} x2="24" y2={((i + 1) * 18) / r} />)}
    </svg>
  );
}

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
  const [community, setCommunity] = useState(null);   // approved Community Photos
  const [cTopic, setCTopic] = useState('all');
  const [mine, setMine] = useState(null);             // this device's uploads, with status
  const [copied, setCopied] = useState('');
  // Dark by default (owner, 2026-11-21), Light on the toggle, kept on this device.
  const [tone, setTone] = useState('dark');
  useEffect(() => { try { if (localStorage.getItem(LOOK_KEY) === 'light') setTone('light'); } catch (e) {} }, []);
  const flipTone = () => setTone((t) => { const n = t === 'dark' ? 'light' : 'dark'; try { localStorage.setItem(LOOK_KEY, n); } catch (e) {} return n; });
  const T = TABLE[tone];
  useStageChrome(T.ground);
  const cutD = useMemo(() => cutPath(size), [size]);
  // The big picture at the top shows the daily's own cut, wide.
  const heroD = useMemo(() => cutPath(80, 80, 300, 120), []);
  const hero = past[0] || null;

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
    if (tab !== 'community' || community) return undefined;
    let alive = true;
    fetch('/api/photo-puzzles?community=1').then((r) => r.json())
      .then((d) => { if (alive) setCommunity(Array.isArray(d && d.items) ? d.items : []); })
      .catch(() => { if (alive) setCommunity([]); });
    return () => { alive = false; };
  }, [tab, community]);

  useEffect(() => {
    if (tab !== 'yours' || mine) return undefined;
    let alive = true;
    let local = [];
    try { local = JSON.parse(localStorage.getItem(MINE_KEY) || '[]'); if (!Array.isArray(local)) local = []; } catch (e) { local = []; }
    if (!local.length) { setMine([]); return undefined; }
    fetch('/api/photo-puzzles', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'mine', items: local.map((x) => ({ code: x.code })) }) })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const by = new Map(((d && d.items) || []).map((x) => [x.code, x]));
        setMine(local.map((x) => ({ ...x, ...(by.get(x.code) || { status: 'gone' }) })));
      })
      .catch(() => { if (alive) setMine(local.map((x) => ({ ...x, status: 'unknown' }))); });
    return () => { alive = false; };
  }, [tab, mine]);

  async function turnOff(x) {
    if (!window.confirm(`Turn off the link for "${x.name}"? The photo is deleted and the link stops working for everyone.`)) return;
    try {
      const r = await fetch('/api/photo-puzzles', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'off', code: x.code, token: x.token }) }).then((q) => q.json());
      if (r && r.ok) setMine((a) => a.map((y) => (y.code === x.code ? { ...y, status: 'off' } : y)));
    } catch (e) { /* stays as it was */ }
  }
  async function copyLink(x) {
    try { await navigator.clipboard.writeText(`${window.location.origin}/jigsaw/p/${x.code}`); setCopied(x.code); setTimeout(() => setCopied(''), 2000); } catch (e) { /* no clipboard */ }
  }

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
    <div className={`jp-table ${tone}`} style={{ '--stg-ground': T.ground, '--stg-ink': T.ink, '--stg-ink2': T.ink2, '--stg-mute': T.mute, '--stg-surf': T.surf, '--stg-surf2': T.surf2, '--stg-line': T.line, '--jp-cutc': T.cut, '--jp-hue': T.ink, '--jp-ink': T.ground }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="jp-top"><StageTopBar look={tone === 'dark' ? 'dark' : 'plain'} onFlip={flipTone} ink={T.ink} href="/" share /></div>
      <nav className="jp-crumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span aria-hidden="true">/</span>
        {crumb ? <><a href={crumb.href}>{crumb.label}</a><span aria-hidden="true">/</span></> : null}
        <span aria-current="page">Jigsaw Puzzles</span>
        <span className="jp-a2h" style={{ '--stg-raise': T.ground, '--stg-acc': T.ink, '--stg-onramp': T.ground }}><AddToHome name="Jigsaw Puzzles" compact opens="The tile opens the Jigsaw Puzzles page, with every puzzle on it." /></span>
      </nav>

      <header className="jp-hero">
        {hero ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="jp-heroimg" style={focusStyle(hero.g, hero.n)} src={thumb(hero, 1280)} alt={`${hero.name}, the newest jigsaw puzzle picture`} width="1280" height="853" fetchPriority="high" />
            <Cuts d={heroD} vb="0 0 300 120" />
          </>
        ) : null}
        <div className="jp-shade" aria-hidden="true" />
        <div className="jp-htx">
          <span className="jp-eyb">Free Online Jigsaw Puzzles · New Every Day</span>
          <h1>Jigsaw Puzzles</h1>
          <p className="jp-lede">
            Real photographs from around the world: {past.length} pictures so far, each one playable at 24 to 4,000 pieces.
            Pick a size once, then pick a picture. No download, no signup.
          </p>
          <div className="jp-btns">
            {todays.map((b) => (
              <a key={b.k} className={`jp-b${b.g === 'jig' ? ' pri' : ''}`} href={`/${b.g}`}>
                {b.g === 'jig' ? <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg> : null}
                Today&apos;s {GNAME[b.g]}<small>{marks.solved.has(b.k) ? 'Solved' : `${b.c * b.r} pieces`}</small>
              </a>
            ))}
            <a className="jp-b" href="/mural">Mural<small>4,000 pieces, together</small></a>
            <a className="jp-b" href="/jigsaw/make-your-own">Your Photo<small>Make your own</small></a>
          </div>
        </div>
        {hero ? (
          <a className="jp-pictured" href={hydrated ? playHref(hero, size) : `/${hero.g}?p=${hero.n}`}>
            Pictured: {hero.name} · play it at {sizeLabel(size)} pieces
          </a>
        ) : null}
      </header>

      <div className="jp-wrap">
      <nav className="jp-tabs" aria-label="Jigsaw sections">
        {TABS.map(([k, lab]) => (
          <a key={k} href={k === 'all' ? '/jig/shelf' : `/jig/shelf?tab=${k}`} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined}
            onClick={(e) => { e.preventDefault(); pickTab(k); }}>
            {lab}{k === 'all' ? <b>{past.length}</b> : k === 'daily' ? <b>{boards.length}</b> : null}
          </a>
        ))}
        <span className="jp-sp" />
        <button type="button" className="jp-tone" onClick={flipTone} aria-label={tone === 'dark' ? 'Switch to the light table' : 'Switch to the dark table'}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" /></svg>
          <span>{tone === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </nav>

      {tab === 'all' ? (
        <>
          <h2 className="jp-lh" id="jp-plab">How many pieces?</h2>
          <div className="jp-ladder">
            <div className="jp-steps" role="group" aria-labelledby="jp-plab">
              {JIGSAW_SIZES.map((s) => (
                <button key={s} type="button" className={`${size === s ? 'on' : ''}${PHONE_SIZES.includes(s) ? '' : ' jp-nophone'}`} aria-pressed={size === s}
                  aria-label={`${sizeLabel(s)} pieces`} onClick={() => pickSize(s)}>
                  <SizeIcon s={s} />
                  <span className="jp-long">{sizeLabel(s)}</span><span className="jp-short">{shortSize(s)}</span>
                </button>
              ))}
            </div>
            {size > ALWAYS_OK ? (
              <p className="jp-avail" aria-live="polite">
                <span>{fit ? <><b>{okCount} of {filtered.length}</b> pictures have the detail for {sizeLabel(size)} pieces. The rest are greyed.</> : `Checking which pictures have the detail for ${sizeLabel(size)} pieces.`}</span>
                <label className="jp-chk"><input type="checkbox" checked={hideOff} onChange={(e) => setHideOff(e.target.checked)} />Hide them</label>
              </p>
            ) : <p className="jp-avail"><span>Every picture can be cut to {sizeLabel(size)} pieces.</span></p>}
          </div>

          <div className="jp-row2">
          <div className="jp-topics" role="group" aria-label="Topic">
            <button type="button" className={topic === 'all' ? 'on' : ''} aria-pressed={topic === 'all'} onClick={() => setTopic('all')}>All <b>{topicN('all')}</b></button>
            {allTopics.map((t) => (
              <button key={t.slug} type="button" className={topic === t.slug ? 'on' : ''} aria-pressed={topic === t.slug} onClick={() => setTopic(t.slug)}>{t.label} <b>{topicN(t.slug)}</b></button>
            ))}
          </div>
            <div className="jp-seg sm" role="group" aria-label="Shape">
              {[['both', 'Both'], ['wide', 'Wide'], ['tall', 'Tall']].map(([k, lab]) => (
                <button key={k} type="button" className={shape === k ? 'on' : ''} aria-pressed={shape === k} onClick={() => setShape(k)}>{lab}</button>
              ))}
            </div>
            <span className="jp-selw">
            <select className="jp-sel" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort the pictures">
              <option value="new">Newest</option>
              <option value="old">Oldest</option>
              <option value="todo">Not done</option>
              <option value="big">Most pieces</option>
            </select>
            <svg className="jp-selc" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <label className="jp-search">
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Dogs, Venice, waterfalls" aria-label="Search the jigsaw pictures" />
            </label>
          </div>

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
                      <img src={thumb(b, 500)} style={focusStyle(b.g, b.n)} alt={`${b.name}, ${b.g === 'saw' ? 'tall ' : ''}jigsaw puzzle`} width="500" height="333"
                        loading={i < 6 ? 'eager' : 'lazy'} decoding="async" />
                      {ok ? <Cuts d={cutD} /> : null}
                      {b.g === 'saw' ? <span className="jp-bd tall">Tall</span> : null}
                      {!ok ? <span className="jp-max"><b>Up to {sizeLabel(maxOf(b))}</b><span>Too little detail for {sizeLabel(size)}</span></span>
                        : done ? <span className="jp-bd done"><svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2l2.3 2.3 4.7-4.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>Done at {sizeLabel(size)}</span>
                          : res ? <span className="jp-bd res">{res === 'own' ? 'In progress' : `Resume ${res}%`}</span> : null}
                    </span>
                    <span className="jp-cap">{b.name}</span>
                    <span className="jp-sub">{GNAME[b.g]} No. {b.n}{b.topic ? ` · ${(allTopics.find((t) => t.slug === b.topic) || {}).label || ''}` : ''}</span>
                  </>
                );
                return (
                  <li key={b.k} className="jp-li">
                    {b.g === 'jig' ? (
                      <a className="jp-tog" href={`/mural/private?photo=${b.n}&size=${togetherKey(size, maxOf(b))}`}
                        aria-label={`Play ${b.name} together: start a private mural with your group or anyone you send the link to`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="17" cy="9" r="2.6" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M16.5 14.2c2.4.1 4.1 1.6 4.5 4.3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        Play Together
                      </a>
                    ) : null}
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
                        : <img src={thumb(b, 500)} style={focusStyle(b.g, b.n)} alt={b.today ? `Today's ${GNAME[b.g]}` : `${b.name}, ${GNAME[b.g]} No. ${b.n}`} width="500" height="333" loading="lazy" decoding="async" />}
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

      {tab === 'community' ? (
        <section aria-label="Community Photos">
          <p className="jp-mlede">
            Jigsaw puzzles made from photos Mind Loft players shared: pets, home cooking, hometowns and trips. Every one is reviewed before it goes up, and each plays at any size its photo can do.
            {' '}<a href="/jigsaw/make-your-own">Make a jigsaw from your own photo</a> and submit it here.
          </p>
          {community && community.length ? (
            <div className="jp-ctopics" role="group" aria-label="Topic">
              {[['all', 'All'], ...PHOTO_TOPICS.map((t) => [t[0], t[1]])].filter(([k]) => k === 'all' || community.some((x) => x.topic === k)).map(([k, l]) => (
                <button key={k} type="button" className={cTopic === k ? 'on' : ''} aria-pressed={cTopic === k} onClick={() => setCTopic(k)}>{l}</button>
              ))}
            </div>
          ) : null}
          {community === null ? <p className="jp-mnone">Loading Community Photos.</p> : !community.length ? (
            <div className="jp-none"><p>No Community Photos yet. Be the first: make a puzzle from your photo and submit it.</p><a className="jp-kbtn" href="/jigsaw/make-your-own">Upload a Photo</a></div>
          ) : (
            <ul className="jp-grid">
              {community.filter((x) => cTopic === 'all' || x.topic === cTopic).map((x) => (
                <li key={x.code}>
                  <a className="jp-card" href={`/jigsaw/community/${x.slug}`}>
                    <span className="jp-ph">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${imgSrc(x.code)}&w=500`} alt={`${x.name} jigsaw puzzle`} loading="lazy" />
                      <span className="jp-bd res">Up to {sizeLabel(x.max)}</span>
                    </span>
                    <span className="jp-cap">{x.name}</span>
                    <span className="jp-sub">Shared by {x.by || 'a Mind Loft player'} · {topicLabel(x.topic)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === 'yours' ? (
        <section aria-label="Your Photos">
          <p className="jp-mlede">
            Puzzles you made from your own photos on this device. Each has a private link only the people you send it to can open.
            {' '}<a href="/jigsaw/make-your-own">Make another</a>.
          </p>
          {mine === null ? <p className="jp-mnone">Loading your photos.</p> : !mine.length ? (
            <div className="jp-none"><p>You have not made a photo puzzle on this device yet.</p><a className="jp-kbtn" href="/jigsaw/make-your-own">Upload a Photo</a></div>
          ) : (
            <ul className="jp-grid">
              {mine.map((x) => {
                const live = x.status === 'private' || x.status === 'pending' || x.status === 'approved';
                const label = { private: 'Private link', pending: 'Private link · Community Photos: waiting for review', approved: 'Private link · On Community Photos', declined: 'Not approved for Community Photos, link off', off: 'Link turned off', gone: 'Not found', unknown: 'Could not check' }[x.status] || '';
                return (
                  <li key={x.code}>
                    <div className={`jp-card${live ? '' : ' off'}`}>
                      <a className="jp-ph" href={live ? `/jigsaw/p/${x.code}` : undefined}>
                        {live ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`${imgSrc(x.code)}&w=500`} alt={x.name} loading="lazy" />
                        ) : null}
                      </a>
                      <span className="jp-cap">{x.name}</span>
                      <span className="jp-sub">{label}</span>
                      {live ? (
                        <span className="jp-mine">
                          <button type="button" onClick={() => copyLink(x)}>{copied === x.code ? 'Copied' : 'Copy Link'}</button>
                          {x.token ? <button type="button" onClick={() => turnOff(x)}>Turn Off</button> : null}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
            <a href="/jigsaw/make-your-own">Make a jigsaw from your photo</a>
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
      </div>
      <StageFooter />
    </div>
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
.jp-crumb .jp-a2h{margin-left:auto;display:inline-flex;}
.jp-crumb .jp-a2h:empty{display:none;}
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
.jp-selw{position:relative;display:inline-flex;align-items:center;flex:none;color:var(--stg-ink);}
.jp-sel{font:inherit;font-size:13px;font-weight:800;height:40px;padding:0 36px 0 14px;border:1px solid var(--stg-line);border-radius:10px;background:var(--stg-surf);color:var(--stg-ink);-webkit-appearance:none;-moz-appearance:none;appearance:none;cursor:pointer;}
.jp-sel:hover{border-color:var(--stg-ink);}
.jp-selc{position:absolute;right:14px;top:50%;margin-top:-6px;pointer-events:none;}
.jp-row2{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:4px 0 14px;}
.jp-row2 .jp-topics{margin:0;}
.jp-row2 .jp-search{flex:1 1 200px;width:auto;max-width:300px;margin-left:auto;}
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
.jp-li{position:relative;}
.jp-tog{position:absolute;left:10px;top:10px;z-index:2;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 11px 0 9px;border-radius:999px;background:rgba(22,18,14,.82);color:#f4ead8;font-size:12.5px;font-weight:800;text-decoration:none;white-space:nowrap;transition:opacity .15s,background .15s;}
.jp-tog:hover{background:rgba(22,18,14,.96);}
.jp-tog:focus-visible{outline:2px solid #f4ead8;outline-offset:2px;}
@media (hover:hover){.jp-tog{opacity:0;}.jp-li:hover .jp-tog,.jp-tog:focus-visible{opacity:1;}}
.jp-card.off img{filter:grayscale(1);opacity:.4;}
.jp-card.off .jp-cap{color:var(--stg-mute);}
.jp-q{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:800;color:var(--jp-ink);background:var(--jp-hue);}
.jp-none{padding:30px 0;text-align:center;}
.jp-none p{margin:0 0 12px;font-size:15px;font-weight:700;color:var(--stg-ink2);}
.jp-none button,.jp-kbtn{font:inherit;font-size:14px;font-weight:800;min-height:44px;padding:0 22px;border-radius:12px;border:1px solid var(--stg-ink);background:var(--stg-surf);color:var(--stg-ink);cursor:pointer;display:inline-flex;align-items:center;text-decoration:none;}
.jp-note{margin:20px 0 0;font-size:13.5px;line-height:1.55;font-weight:600;color:var(--stg-mute);max-width:760px;}
.jp-ctopics{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px;}
.jp-ctopics button,.jp-mine button{font:inherit;font-size:13.5px;font-weight:800;min-height:40px;padding:0 16px;border-radius:999px;border:1px solid var(--stg-line);background:transparent;color:var(--stg-ink);cursor:pointer;}
.jp-ctopics button.on{background:var(--stg-ink);color:var(--stg-ground);border-color:var(--stg-ink);}
.jp-mine{display:flex;gap:8px;flex-wrap:wrap;}
.jp-mine button{border-radius:10px;border-color:var(--stg-ink);}
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
@media (max-width:900px){.jp-row2 .jp-search{width:100%;max-width:none;flex-basis:100%;margin-left:0;}.jp-row2 .jp-sp{display:none;}.jp-row2 .jp-topics{width:100%;}}
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
  .jp-selw{flex:1;}
  .jp-sel{width:100%;}
  .jp-topics{flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px;}
  .jp-topics button{flex:none;}
  .jp-grid{grid-template-columns:minmax(0,1fr);gap:18px;}
  .jp-grid.daily{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 10px;}
  .jp-grid.daily .jp-cap{font-size:13px;}
  .jp-faq{grid-template-columns:minmax(0,1fr);}
}
@media (prefers-reduced-motion:reduce){.jp-ph img{transition:none;}a.jp-card:hover .jp-ph img{transform:none;}}

/* THE PUZZLE TABLE (owner, 2026-11-21). Everything above keeps working off the
   stage tokens, which the root sets from TABLE; these rules belong to the table. */
.jp-table{background:var(--stg-ground);color:var(--stg-ink);min-height:100vh;font-family:'Manrope',system-ui,sans-serif;}
.jp-top{max-width:1360px;margin:0 auto;padding:max(12px, var(--safe-top, 0px)) 32px 8px;box-sizing:border-box;}
.jp-top .stb{--stb-w:100%;width:100%;margin-left:0;}
html.lc-on:not(.lc-focus) .jp-top{display:none;}
.jp-table>.jp-crumb{max-width:1360px;margin:0 auto;padding:10px 32px 12px;box-sizing:border-box;}
.jp-wrap{max-width:1360px;margin:0 auto;padding:0 32px 40px;box-sizing:border-box;}
.jp-hero{position:relative;min-height:500px;overflow:hidden;display:flex;align-items:flex-end;background:var(--stg-surf);}
.jp-heroimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
.jp-hero .jp-cut{position:absolute;inset:0;width:100%;height:100%;}
.jp-hero{--jp-gut:calc(max(0px, (100% - 1360px) / 2) + 32px);}
.jp-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(22,18,14,.92) 0%,rgba(22,18,14,.88) var(--jp-gut),rgba(22,18,14,.55) calc(var(--jp-gut) + 520px),rgba(22,18,14,0) calc(var(--jp-gut) + 900px));}
.jp-htx{position:relative;box-sizing:content-box;max-width:488px;padding:56px 56px 56px var(--jp-gut);display:flex;flex-direction:column;gap:14px;}
.jp-htx,.jp-htx *{color:#f4ead8;}
.jp-eyb{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.75;}
.jp-hero h1{margin:0;font-size:64px;line-height:1.04;font-weight:800;letter-spacing:-0.03em;padding-bottom:.06em;}
.jp-hero .jp-lede{margin:0;font-size:17px;line-height:1.55;font-weight:600;opacity:.82;max-width:520px;}
.jp-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;}
.jp-b{display:inline-flex;align-items:center;gap:9px;height:52px;padding:0 20px;border-radius:14px;border:1px solid #f4ead8;font-size:16px;font-weight:800;text-decoration:none;}
.jp-b small{font-size:12px;font-weight:700;opacity:.72;}
.jp-b.pri{background:#f4ead8;}
.jp-b.pri,.jp-b.pri *{color:#16120e;}
.jp-b:hover{filter:brightness(1.08);}
.jp-pictured{position:absolute;right:calc(max(0px, (100% - 1360px) / 2) + 32px);bottom:16px;padding:7px 12px;border-radius:999px;background:rgba(22,18,14,.78);color:#f4ead8 !important;font-size:12.5px;font-weight:800;text-decoration:none;max-width:calc(100% - 64px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.jp-pictured:hover{background:rgba(22,18,14,.92);}
.jp-cut path{fill:none;stroke:var(--jp-cutc);opacity:.8;stroke-width:1;vector-effect:non-scaling-stroke;}
.jp-tabs{margin-top:18px;align-items:center;}
.jp-tone{flex:none;display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 14px;margin-bottom:8px;border:1px solid var(--stg-line);border-radius:999px;background:transparent;color:var(--stg-ink);font:inherit;font-size:13px;font-weight:800;cursor:pointer;}
.jp-tone:hover{border-color:var(--stg-ink);}
.jp-ladder{position:sticky;top:var(--lc-hh,0px);z-index:6;display:flex;flex-direction:column;align-items:center;gap:10px;margin:0 -32px 16px;padding:12px 32px 12px;background:var(--stg-ground);border-bottom:1px solid var(--stg-line);}
html:not(.lc-on) .jp-ladder,html.lc-focus .jp-ladder{top:0;}
.jp-lh{margin:26px 0 0;text-align:center;font-size:26px;font-weight:800;letter-spacing:-0.02em;}
.jp-steps{display:flex;border:1px solid var(--stg-ink);border-radius:16px;overflow:hidden;max-width:100%;}
.jp-steps button{flex:none;display:flex;flex-direction:column;align-items:center;gap:6px;width:96px;padding:10px 0;border:0;border-left:1px solid var(--stg-line);border-radius:0;background:transparent;color:var(--stg-ink);font:inherit;font-size:16px;font-weight:800;cursor:pointer;}
.jp-steps button:first-child{border-left:0;}
.jp-steps button.on{background:var(--stg-ink);color:var(--stg-ground);}
.jp-steps button:hover:not(.on){background:var(--stg-surf);}
.jp-ico{width:24px;height:18px;}
.jp-ico rect,.jp-ico line{fill:none;stroke:currentColor;stroke-width:.8;}
.jp-ladder .jp-avail{margin:0;justify-content:center;color:var(--stg-mute);}
.jp-ladder .jp-avail b{color:var(--stg-ink);}
.jp-row2{margin:0 0 18px;}
.jp-seg{background:transparent;border-color:var(--stg-line);}
.jp-seg button{border-right-color:var(--stg-line);}
.jp-seg button.on{background:var(--stg-ink);color:var(--stg-ground);}
.jp-topics button{background:transparent;}
.jp-topics button.on{background:var(--stg-ink);color:var(--stg-ground);}
.jp-search,.jp-sel{background:transparent;}
.jp-sel option{background:var(--stg-ground);color:var(--stg-ink);}
.jp-grid{gap:30px 22px;}
.jp-ph{aspect-ratio:4/3;border:0;border-radius:10px;background:var(--stg-surf);}
.jp-ph .jp-cut{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.jp-cap{font-size:17px;font-weight:800;line-height:1.3;}
.jp-bd{border:0;background:rgba(22,18,14,.82);color:#f4ead8;}
.jp-bd.done{background:#f4ead8;color:#16120e;}
.jp-bd.res{background:rgba(22,18,14,.82);color:#f4ead8;}
.jp-card.off img{filter:grayscale(1) brightness(.55);opacity:1;}
.jp-max{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;padding:10px;}
.jp-max,.jp-max *{color:#f4ead8;}
.jp-max b{font-size:22px;font-weight:800;}
.jp-max span{font-size:13px;font-weight:700;opacity:.75;}
.jp-q{background:var(--stg-surf);color:var(--stg-ink);}
.jp-faq .jp-qa{background:transparent;}
.jp-more a{background:transparent;}
@media (max-width:1100px){.jp-steps button{width:76px;font-size:14px;}}
@media (max-width:900px){.jp-hero{min-height:440px;}.jp-hero h1{font-size:44px;}.jp-htx{padding:28px 24px 28px 18px;}.jp-wrap{padding:0 18px 32px;}.jp-ladder{margin:0 -18px 14px;padding:16px 18px 14px;}.jp-table>.jp-crumb{padding:10px 18px;}.jp-top{padding-left:18px;padding-right:18px;}.jp-pictured{right:18px;max-width:calc(100% - 36px);}}
@media (max-width:640px){
  .jp-hero{min-height:420px;}
  .jp-shade{background:linear-gradient(0deg,rgba(22,18,14,.95) 0%,rgba(22,18,14,.45) 58%,rgba(22,18,14,0) 85%);}
  .jp-htx{padding:20px 14px 56px;gap:10px;}
  .jp-hero h1{font-size:36px;}
  .jp-hero .jp-lede{font-size:14.5px;}
  .jp-btns{flex-direction:column;align-items:stretch;}
  .jp-b{justify-content:center;height:48px;}
  .jp-pictured{left:14px;right:auto;bottom:12px;max-width:calc(100% - 28px);}
  .jp-lh{font-size:20px;margin-top:18px;}
  .jp-steps{width:100%;}
  .jp-steps button{flex:1;width:auto;padding:8px 0;font-size:13px;}
  .jp-steps button.jp-nophone{display:none;}
  .jp-ladder .jp-avail{font-size:12.5px;text-align:center;}
  .jp-wrap{padding:0 14px 28px;}
  .jp-ladder{margin:0 -14px 12px;padding:14px 14px 12px;}
  .jp-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 12px;}
  .jp-cap{font-size:14px;}
  .jp-max b{font-size:16px;}
  .jp-max span{display:none;}
  .jp-tone span{display:none;}
}
`;
