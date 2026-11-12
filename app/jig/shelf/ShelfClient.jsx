'use client';

// THE JIGSAW PUZZLE SHELF, the client half of /jig/shelf (owner, 2026-10-16;
// Saw joined and the shelf was renamed and recoloured 2026-11-11).
//
// Every board is a small box: a lid with its number, the photograph, and a
// sticker with its piece count, standing on a wooden plank, a week to a shelf,
// newest week first. Each week has a Jig plank and, from Saw's first week, a
// Saw plank under it (Saw boxes are tall, like its photos). Today's boxes are
// question marks. Picking a box opens it in the side panel (below the shelf on
// a phone), which says what it is, who took the photo, and plays it.
//
// The boxes are real links to /jig?p=N or /saw?p=N in the server HTML, so a
// crawler walks the whole archive. In the browser a click SELECTS instead.
//
// Solved and played marks: this device's saves first (sot_jig_N, sot_saw_N),
// then the server's history merged in through the shared day-status client.
// A today box shows its picture only once this device has finished it.
//
// COLOUR (2026-11-11): everything that is not a photo or the wooden plank
// reads the page's own tokens. The lids, the today box, the selected ring, the
// Sunday mark and the filter chips all wear the Logic accent (--stg-acc with
// --stg-onramp ink), the same as the call to action, so the shelf matches its
// page in both registers. The old navy lids and gold Sunday lids were the
// pre-ramp palette and are gone; do not bring back a literal hue here.
import { useEffect, useMemo, useState } from 'react';
import CircuitFrame from '../../circuits/CircuitFrame';
import { fetchDayStatus } from '../../useDayStats';
import { migrateJigSaves } from '@/lib/jig-renum';
import { gameColor, softGround } from '@/lib/category-ramp';

// THE SHELF WEARS THE SITE'S SOFT PASTEL (owner, 2026-11-12: "the colors on the
// jigsaw shelf page... none match new styling"). Its accents used --stg-acc,
// which on this CircuitFrame page is the raw deep Logic rose; the site's own
// pastel is the category step softened 40% toward white (softGround), the tone
// the home tiles wear, carrying near-black ink in light and dark alike.
const JIG_HUE = softGround(gameColor('jig'));

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 86400000;
const GAMES = ['jig', 'saw'];
const GNAME = { jig: 'Jig', saw: 'Saw' };
const GBLURB = { jig: 'wide, 80 pieces', saw: 'tall, loose table' };

const atNoon = (iso) => new Date(iso + 'T12:00:00Z');
const isoOf = (d) => d.toISOString().slice(0, 10);
const shortDate = (iso) => { const d = atNoon(iso); return `${DOW[d.getUTCDay()]}, ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`; };
const quizIdOf = (g, iso) => { const d = atNoon(iso); return `${g}-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`; };
// The Monday of the week holding `iso`.
const mondayOf = (iso) => { const d = atNoon(iso); return isoOf(new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY_MS)); };
const thumb = (b, w) => `/api/${b.g}/img?n=${b.n}&w=${w}`;
const hrefOf = (b) => (b.today ? `/${b.g}` : `/${b.g}?p=${b.n}`);

export default function ShelfClient({ boards, today, crumb, faq }) {
  const byDay = useMemo(() => new Map(boards.map((b) => [`${b.g}|${b.d}`, b])), [boards]);
  const firstOf = useMemo(() => {
    const f = {};
    for (const b of boards) if (!f[b.g] || b.d < f[b.g]) f[b.g] = b.d;
    return f;
  }, [boards]);
  const todays = boards.filter((b) => b.today);
  const total = boards.length;
  const per = (g) => boards.filter((b) => b.g === g).length;

  // The shelves: one per Monday-to-Sunday week, from today's week back to the
  // week of the first board. Each week holds a plank per game that had begun
  // by that week. A day after today is a locked box; a day before that game's
  // first board is an empty slot.
  const weeks = useMemo(() => {
    if (!boards.length) return [];
    const first = boards.reduce((m, b) => (b.d < m ? b.d : m), boards[0].d);
    const out = [];
    const thisMon = mondayOf(today);
    for (let mon = thisMon; mon >= mondayOf(first); mon = isoOf(new Date(atNoon(mon).getTime() - 7 * DAY_MS))) {
      const sun = isoOf(new Date(atNoon(mon).getTime() + 6 * DAY_MS));
      const rows = [];
      for (const g of GAMES) {
        if (!firstOf[g] || firstOf[g] > sun) continue;
        const days = [];
        for (let k = 0; k < 7; k++) {
          const iso = isoOf(new Date(atNoon(mon).getTime() + k * DAY_MS));
          const b = byDay.get(`${g}|${iso}`);
          days.push(b ? { kind: 'box', b } : { kind: iso > today ? 'locked' : 'empty', iso });
        }
        rows.push({ g, days });
      }
      const ago = Math.round((atNoon(thisMon) - atNoon(mon)) / (7 * DAY_MS));
      const label = ago === 0 ? 'This week' : ago === 1 ? 'Last week' : `Week of ${MON[atNoon(mon).getUTCMonth()]} ${atNoon(mon).getUTCDate()}`;
      out.push({ mon, label, rows });
    }
    return out;
  }, [boards, byDay, firstOf, today]);

  // Marks, keyed by board key ('jig-12'). This device's saves, then the
  // server history merged over them.
  const [marks, setMarks] = useState({ solved: new Set(), played: new Set(), open: new Set(), ready: false });
  useEffect(() => {
    migrateJigSaves();
    let alive = true;
    const solved = new Set();
    const played = new Set();
    const open = new Set();
    for (const b of boards) {
      let sv = null;
      try { sv = JSON.parse(localStorage.getItem(`sot_${b.g}_${b.n}`) || 'null'); } catch (e) { sv = null; }
      if (!sv || typeof sv !== 'object') continue;
      if (sv.status === 'won') { solved.add(b.k); played.add(b.k); }
      else if (sv.status && sv.status !== 'playing') played.add(b.k);
      if (b.today && sv.status && sv.status !== 'playing') open.add(b.k);
    }
    setMarks({ solved, played, open, ready: true });
    const byQuiz = new Map(boards.map((b) => [quizIdOf(b.g, b.d), b.k]));
    fetchDayStatus().then((d) => {
      if (!alive || !d) return;
      const s2 = new Set(solved);
      const p2 = new Set(played);
      const take = (list, set) => { for (const q of list || []) { const k = byQuiz.get(q); if (k) set.add(k); } };
      take(d.played, p2);
      take(d.completed, p2);
      take(d.completed, s2);
      setMarks({ solved: s2, played: p2, open, ready: true });
    }).catch(() => {});
    return () => { alive = false; };
  }, [boards]);

  const [filter, setFilter] = useState('all');
  useEffect(() => {
    // ?g=saw (the link under Saw's board) opens on Saw. Read after mount so
    // the server HTML and the first client render agree.
    try { const g = new URLSearchParams(window.location.search).get('g'); if (g === 'saw' || g === 'jig') setFilter(g); } catch (e) {}
  }, []);
  const counts = {
    all: total,
    jig: per('jig'),
    saw: per('saw'),
    solved: boards.filter((b) => marks.solved.has(b.k)).length,
    unplayed: boards.filter((b) => !marks.played.has(b.k)).length,
    sun: boards.filter((b) => b.s).length,
  };
  // A game filter hides the other game's planks outright; the rest dim the
  // boxes that do not match, so the week grid keeps its shape.
  const rowShown = (g) => (filter === 'jig' || filter === 'saw' ? g === filter : true);
  const shows = (b) => (filter === 'solved' ? marks.solved.has(b.k)
    : filter === 'unplayed' ? !marks.played.has(b.k)
      : filter === 'sun' ? !!b.s
        : true);

  // The open box: the newest past board until the reader picks one.
  const [sel, setSel] = useState(() => {
    const p = boards.find((b) => !b.today);
    return (p || boards[0] || {}).k || null;
  });
  useEffect(() => {
    if (filter !== 'jig' && filter !== 'saw') return;
    const curB = boards.find((b) => b.k === sel);
    if (curB && curB.g === filter) return;
    const p = boards.find((b) => b.g === filter && !b.today) || boards.find((b) => b.g === filter);
    if (p) setSel(p.k);
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = boards.find((b) => b.k === sel) || null;
  const pick = (e, b) => {
    e.preventDefault();
    setSel(b.k);
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
      const el = document.getElementById('jsh-panel');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
    }
  };

  return (
    <CircuitFrame cat="Visual" label="Jigsaw shelf" wide bar={{ title: 'Jigsaw Shelf', sub: 'Every Jig and Saw', dot: JIG_HUE }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <nav className="jsh-crumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span aria-hidden="true">/</span>
        {crumb ? <><a href={crumb.href}>{crumb.label}</a><span aria-hidden="true">/</span></> : null}
        <span aria-current="page">Jigsaw Puzzle Shelf</span>
      </nav>

      <header className="jsh-head">
        <div>
          <h1>Jigsaw Puzzle Shelf</h1>
          <p className="jsh-lede">
            Every daily jigsaw so far, newest week first: Jig on the top plank, the tall Saw below it.
            Pick any past box to play it free from the archive. Today&apos;s boxes stay question marks until you finish them.
          </p>
        </div>
        <div className="jsh-todays">
          {todays.map((b) => (
            <a key={b.k} className="jsh-today" href={`/${b.g}`}>
              <span>Today&apos;s {GNAME[b.g]}</span>
              <small>{marks.solved.has(b.k) ? 'Solved ✓' : marks.played.has(b.k) ? 'Played' : 'Play now'}</small>
            </a>
          ))}
        </div>
      </header>

      <div className="jsh-chips" role="group" aria-label="Show">
        {[
          ['all', 'All'],
          ['jig', 'Jig'],
          ['saw', 'Saw'],
          ['solved', 'Solved'],
          ['unplayed', 'Not played'],
          ['sun', 'Sundays'],
        ].map(([k, lab]) => (
          <button key={k} type="button" className={filter === k ? 'on' : ''} aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {lab} <b>{marks.ready || k === 'all' || k === 'sun' || k === 'jig' || k === 'saw' ? counts[k] : '–'}</b>
          </button>
        ))}
      </div>

      <div className="jsh-grid">
        <section className="jsh-shelves" aria-label="The shelf, a week to a row">
          <div className="jsh-dow" aria-hidden="true">
            <span />
            <div className="jsh-dowr">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
          </div>
          {weeks.map((w) => {
            const rows = w.rows.filter((r) => rowShown(r.g));
            if (!rows.length) return null;
            return (
              <div className="jsh-week" key={w.mon}>
                <div className="jsh-wlab">{w.label}</div>
                {rows.map((row) => (
                  <div className={`jsh-line ${row.g}`} key={row.g}>
                    <div className="jsh-glab"><b>{GNAME[row.g]}</b><span>{GBLURB[row.g]}</span></div>
                    <div className="jsh-row">
                      <div className="jsh-plank" aria-hidden="true" />
                      {row.days.map((s, i) => {
                        if (s.kind !== 'box') return <span key={i} className={`jsh-slot ${s.kind}`} aria-hidden="true" />;
                        const b = s.b;
                        const solved = marks.solved.has(b.k);
                        const shut = b.today && !marks.open.has(b.k);
                        const cls = ['jsh-box', b.s ? 'sun' : '', b.today ? 'today' : '', solved ? 'solved' : '',
                          sel === b.k ? 'sel' : '', shows(b) ? '' : 'off'].filter(Boolean).join(' ');
                        const nm = GNAME[b.g];
                        return (
                          <a key={i} className={cls} href={hrefOf(b)} onClick={(e) => pick(e, b)} title={b.today ? `Today's ${nm}` : b.name}
                            aria-label={b.today ? `Today's ${nm}, No. ${b.n}, ${b.c * b.r} pieces` : `${nm} No. ${b.n}, ${shortDate(b.d)}: ${b.name}, ${b.c * b.r} pieces${solved ? ', solved' : ''}`}>
                            <span className="jsh-lid"><span><span className="jsh-no">No. </span>{b.n}</span>{b.s ? <em>SUN</em> : null}</span>
                            <span className="jsh-pic">
                              {shut
                                ? <span className="jsh-q">?</span>
                                : <img src={thumb(b, 330)} alt={b.today ? '' : b.name} loading="lazy" decoding="async" />}
                            </span>
                            <span className="jsh-pc">{b.c * b.r}</span>
                            {solved ? <span className="jsh-tick" aria-hidden="true">{'✓'}</span> : null}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </section>

        <aside className="jsh-panel" id="jsh-panel" aria-live="polite">
          {cur ? <Panel b={cur} solved={marks.solved.has(cur.k)} played={marks.played.has(cur.k)} todayOpen={marks.open.has(cur.k)} /> : null}
        </aside>
      </div>

      <section className="jsh-faq" aria-label="Questions">
        {faq.map((f) => (
          <div className="jsh-qa" key={f.q}>
            <h2>{f.q}</h2>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      <p className="jsh-foot">
        {total} puzzles so far ({counts.jig} Jig, {counts.saw} Saw), a new photograph for each every day at midnight Eastern.
        Every photo is a featured picture from <a href="https://commons.wikimedia.org/" rel="noopener">Wikimedia Commons</a>, credited on its box.
        Playing with a kid? The same photos are on <a href="/kids/jigsaw">Mind Loft Kids</a> in 6 to 30 pieces.
        Looking for another game? The <a href="/archive">puzzle archive</a> has every past board of every daily.
      </p>
    </CircuitFrame>
  );
}

function Panel({ b, solved, played, todayOpen }) {
  const pieces = b.c * b.r;
  const nm = GNAME[b.g];
  const tall = b.g === 'saw';
  if (b.today) {
    return (
      <div className="jsh-card">
        {todayOpen
          ? <img className={`jsh-big${tall ? ' tall' : ''}`} src={thumb(b, 960)} alt={`Today's ${nm} picture`} />
          : <div className={`jsh-big jsh-bigq${tall ? ' tall' : ''}`} aria-hidden="true">?</div>}
        <div className="jsh-meta">
          <div className="jsh-eye">{nm} No. {b.n} · Today{b.s ? ' · Sunday Edition' : ''}</div>
          <h2>{todayOpen ? 'Today’s picture' : 'Today’s picture is a surprise'}</h2>
          <p className="jsh-sub">{pieces} pieces · {b.c} × {b.r} cut</p>
          <p className="jsh-note">
            {todayOpen
              ? 'You finished it on this device, so its box shows the photo.'
              : 'The shelf keeps today covered. Finish it and the box shows the photograph.'}
          </p>
          <a className="jsh-cta" href={`/${b.g}`}>{todayOpen ? `Back to today’s ${nm}` : `Play today’s ${nm}`}</a>
        </div>
      </div>
    );
  }
  return (
    <div className="jsh-card">
      <img className={`jsh-big${tall ? ' tall' : ''}`} src={thumb(b, 960)} alt={b.name} />
      <div className="jsh-meta">
        <div className="jsh-eye">{nm} No. {b.n} · {shortDate(b.d)}{b.s ? ' · Sunday Edition' : ''}</div>
        <h2>{b.name}</h2>
        <p className="jsh-credit">
          Photo: {b.by} · {b.lic} · <a href={b.src} rel="noopener" target="_blank">Wikimedia Commons</a>
        </p>
        <dl className="jsh-facts">
          <div><dt>Pieces</dt><dd>{pieces}</dd></div>
          <div><dt>Cut</dt><dd>{b.c} × {b.r}</dd></div>
          <div><dt>You</dt><dd className={solved ? 'good' : ''}>{solved ? 'Solved' : played ? 'Played' : 'Not played'}</dd></div>
        </dl>
        <a className="jsh-cta" href={`/${b.g}?p=${b.n}`}>{solved || played ? 'Play it again' : 'Play from the archive'}</a>
      </div>
    </div>
  );
}

// A JS template literal: no backticks inside, and no apostrophes either, since
// a quote in a stylesheet rendered by a server page is the escaping trap
// CircuitFrame describes. Every colour below is a token or a mix of tokens,
// except the photographs and the wooden plank (an object, like a chess board).
const CSS = `
:root{--jsh-hue:${JIG_HUE};--jsh-ink:#0b0d12;}
.jsh-crumb{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12.5px;font-weight:700;color:var(--stg-mute);margin-bottom:14px;}
.jsh-crumb a{color:var(--stg-ink2);text-decoration:none;}
.jsh-crumb a:hover{color:var(--stg-ink);text-decoration:underline;}
.jsh-crumb span[aria-current]{color:var(--stg-ink);}

.jsh-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:16px;}
.jsh-head h1{margin:0;font-size:32px;line-height:1.08;font-weight:800;letter-spacing:-0.02em;color:var(--stg-ink);}
.jsh-lede{margin:8px 0 0;max-width:640px;font-size:15px;line-height:1.5;font-weight:600;color:var(--stg-ink2);}
.jsh-todays{flex:none;display:flex;gap:10px;}
.jsh-today{display:flex;flex-direction:column;align-items:center;gap:1px;text-decoration:none;font-size:14px;font-weight:800;padding:10px 18px;border-radius:10px;
  background:var(--jsh-hue);color:var(--jsh-ink);line-height:1.2;}
.jsh-today small{font-size:11px;font-weight:700;opacity:.85;}
.jsh-today:hover{filter:brightness(1.06);}

.jsh-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px;}
.jsh-chips button{font:inherit;font-size:13px;font-weight:800;padding:8px 13px;border-radius:999px;cursor:pointer;
  background:var(--stg-surf);color:var(--stg-ink2);border:1px solid var(--stg-line);}
.jsh-chips button:hover{border-color:var(--stg-ink);color:var(--stg-ink);}
.jsh-chips button b{font-weight:800;color:var(--stg-mute);margin-left:3px;}
.jsh-chips button.on{background:var(--jsh-hue);color:var(--jsh-ink);border-color:var(--jsh-hue);}
.jsh-chips button.on b{color:var(--jsh-ink);opacity:.75;}

.jsh-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:26px;align-items:start;}
.jsh-shelves{min-width:0;padding:14px 16px 6px;border-radius:14px;background:var(--stg-surf);border:1px solid var(--stg-line);}
.jsh-dow,.jsh-line{display:grid;grid-template-columns:88px minmax(0,1fr);gap:12px;align-items:end;}
.jsh-dow{margin-bottom:6px;}
.jsh-dowr{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;}
.jsh-dowr span{text-align:center;font-size:11px;font-weight:800;letter-spacing:.1em;color:var(--stg-mute);}
.jsh-week{margin-bottom:20px;padding-top:4px;}
.jsh-week + .jsh-week{border-top:1px solid var(--stg-line);padding-top:12px;}
.jsh-wlab{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--stg-ink);margin:0 0 8px;}
.jsh-line + .jsh-line{margin-top:16px;}
.jsh-glab{display:flex;flex-direction:column;gap:1px;padding-bottom:16px;line-height:1.2;}
.jsh-glab b{font-size:14px;font-weight:800;color:var(--stg-ink);}
.jsh-glab span{font-size:11px;font-weight:700;color:var(--stg-mute);}
.jsh-row{position:relative;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;align-items:end;padding-bottom:10px;}
.jsh-plank{position:absolute;left:-8px;right:-8px;bottom:0;height:10px;border-radius:3px;
  background:linear-gradient(#b8875a,#8f633d);border-top:2px solid #cfa071;box-shadow:0 4px 6px -2px rgba(0,0,0,.35);}

.jsh-slot{display:block;aspect-ratio:3/2.5;border-radius:5px;}
.jsh-line.saw .jsh-slot{aspect-ratio:4/5.7;}
.jsh-slot.locked{border:1.5px dashed transparent;background:color-mix(in srgb, var(--stg-line) 45%, transparent);}
.jsh-box{position:relative;display:flex;flex-direction:column;text-decoration:none;border-radius:5px;overflow:hidden;
  background:var(--stg-surf2);box-shadow:0 2px 0 color-mix(in srgb, var(--stg-ink) 22%, transparent), 0 6px 12px -6px rgba(0,0,0,.45);
  transition:transform .15s ease, opacity .15s ease, box-shadow .15s ease;}
.jsh-box:hover{transform:translateY(-4px);box-shadow:0 2px 0 color-mix(in srgb, var(--stg-ink) 22%, transparent), 0 12px 18px -8px rgba(0,0,0,.5);}
.jsh-box:focus-visible{outline:3px solid var(--stg-ink);outline-offset:3px;}
.jsh-box.sel{outline:3px solid var(--stg-ink);outline-offset:2px;}
.jsh-box.off{opacity:.22;}
.jsh-lid{display:flex;align-items:center;justify-content:space-between;gap:4px;height:16px;padding:0 5px;
  font-size:9.5px;font-weight:800;letter-spacing:.04em;background:var(--jsh-hue);color:var(--jsh-ink);white-space:nowrap;overflow:hidden;}
.jsh-line.saw .jsh-lid{background:color-mix(in srgb, var(--jsh-hue) 18%, var(--stg-surf2));color:var(--stg-ink);box-shadow:inset 0 -2px 0 var(--jsh-hue);}
.jsh-lid em{font-style:normal;letter-spacing:.08em;padding:0 4px;border-radius:3px;background:var(--jsh-ink);color:var(--jsh-hue);}
.jsh-pic{display:block;position:relative;aspect-ratio:3/2;background:var(--stg-surf2);}
.jsh-line.saw .jsh-pic{aspect-ratio:4/5;}
.jsh-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
.jsh-q{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;
  color:var(--jsh-ink);background:var(--jsh-hue);
  background-image:radial-gradient(circle at 30% 25%, color-mix(in srgb, var(--jsh-ink) 14%, transparent), transparent 60%);}
.jsh-box.today{box-shadow:0 0 0 2px var(--jsh-hue), 0 6px 14px -6px color-mix(in srgb, var(--jsh-hue) 70%, transparent);}
.jsh-pc{position:absolute;right:4px;bottom:4px;font-size:9.5px;font-weight:800;padding:1px 5px;border-radius:7px;
  background:rgba(10,12,18,.72);color:#ffffff;}
.jsh-tick{position:absolute;left:4px;bottom:4px;width:15px;height:15px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:9.5px;font-weight:800;background:var(--stg-good,#1f9d63);color:#ffffff;box-shadow:0 0 0 1.5px rgba(255,255,255,.85);}

.jsh-panel{position:sticky;top:16px;}
.jsh-card{border-radius:14px;overflow:hidden;background:var(--stg-surf);border:1px solid var(--stg-line);}
.jsh-big{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;background:var(--stg-surf2);}
.jsh-big.tall{aspect-ratio:4/5;max-height:440px;}
.jsh-bigq{display:flex;align-items:center;justify-content:center;font-size:64px;font-weight:800;color:var(--jsh-ink);background:var(--jsh-hue);}
.jsh-meta{padding:14px 16px 16px;}
.jsh-eye{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-ink);}
.jsh-meta h2{margin:4px 0 0;font-size:20px;line-height:1.2;font-weight:800;color:var(--stg-ink);}
.jsh-credit,.jsh-sub,.jsh-note{margin:6px 0 0;font-size:13px;line-height:1.45;font-weight:600;color:var(--stg-ink2);}
.jsh-credit a{color:var(--stg-ink2);}
.jsh-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0 0;}
.jsh-facts div{padding:8px 10px;border-radius:9px;background:var(--stg-surf2);}
.jsh-facts dt{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--stg-mute);}
.jsh-facts dd{margin:2px 0 0;font-size:15px;font-weight:800;color:var(--stg-ink);}
.jsh-facts dd.good{color:var(--stg-good);}
.jsh-cta{display:block;margin-top:14px;text-align:center;text-decoration:none;font-size:15px;font-weight:800;padding:13px;
  border-radius:10px;background:var(--jsh-hue);color:var(--jsh-ink);}
.jsh-cta:hover{filter:brightness(1.06);}

.jsh-faq{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:30px;}
.jsh-qa{padding:16px 18px;border-radius:12px;background:var(--stg-surf);border:1px solid var(--stg-line);}
.jsh-qa h2{margin:0;font-size:16px;font-weight:800;color:var(--stg-ink);}
.jsh-qa p{margin:6px 0 0;font-size:14px;line-height:1.5;font-weight:600;color:var(--stg-ink2);}
.jsh-foot{margin:22px 0 0;font-size:13.5px;line-height:1.55;font-weight:600;color:var(--stg-mute);max-width:760px;}
.jsh-foot a{color:var(--stg-ink2);}

@media (max-width:900px){
  .jsh-grid{grid-template-columns:minmax(0,1fr);}
  .jsh-panel{position:static;scroll-margin-top:12px;}
  .jsh-faq{grid-template-columns:minmax(0,1fr);}
  .jsh-big.tall{max-height:520px;}
}
@media (max-width:640px){
  .jsh-head{flex-direction:column;align-items:stretch;}
  .jsh-head h1{font-size:26px;}
  .jsh-lede{font-size:14px;}
  .jsh-todays > a{flex:1;}
  .jsh-chips{gap:6px;}
  .jsh-chips button{padding:7px 10px;font-size:12px;}
  .jsh-shelves{padding:10px 8px 2px;}
  .jsh-dow,.jsh-line{grid-template-columns:minmax(0,1fr);gap:4px;}
  .jsh-dow > span{display:none;}
  .jsh-dowr{gap:6px;}
  .jsh-glab{flex-direction:row;gap:6px;align-items:baseline;padding-bottom:0;}
  .jsh-glab b{font-size:12px;}
  .jsh-glab span{font-size:10.5px;}
  .jsh-row{gap:6px;padding-bottom:8px;}
  .jsh-plank{left:-4px;right:-4px;height:7px;border-top-width:2px;}
  .jsh-no{display:none;}
  .jsh-lid{height:12px;font-size:8.5px;padding:0 3px;justify-content:center;}
  .jsh-lid em{display:none;}
  .jsh-pc{display:none;}
  .jsh-tick{width:12px;height:12px;font-size:8px;left:2px;bottom:2px;}
  .jsh-q{font-size:17px;}
}
@media (prefers-reduced-motion:reduce){.jsh-box{transition:none;}.jsh-box:hover{transform:none;}}
`;
