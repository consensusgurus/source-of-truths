'use client';

// THE JIG PUZZLE SHELF (owner, 2026-10-16), the client half of /jig/shelf.
//
// Every board is a small box: a lid band with its number (gold on a Sunday
// Edition), the photograph, and a sticker with its piece count, standing on a
// wooden plank, a week to a shelf, newest week first. Today's box is a
// question mark. Picking a box opens it in the side panel (below the shelf on
// a phone), which says what it is, who took the photo, and plays it.
//
// The boxes are real links to /jig?p=N in the server HTML, so a crawler walks
// the whole archive. In the browser a click SELECTS instead, and the panel's
// button plays: a shelf you can only browse by leaving it is no shelf.
//
// Solved and played marks: this device's saves first (instant), then the
// server's history merged in through the shared day-status client, exactly as
// the puzzle archive does. Today's box shows its picture only once this device
// holds a finished save for it; the server never sent its name.
//
// Colours: page ink and grounds are stage tokens, so the page follows the
// reader's register like every stage surface. The plank, the lids and the
// piece stickers are OBJECT colours and stay put in both registers, the same
// way a chess board's squares do.
import { useEffect, useMemo, useState } from 'react';
import CircuitFrame from '../../circuits/CircuitFrame';
import { fetchDayStatus } from '../../useDayStats';
import { migrateJigSaves } from '@/lib/jig-renum';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 86400000;

const atNoon = (iso) => new Date(iso + 'T12:00:00Z');
const isoOf = (d) => d.toISOString().slice(0, 10);
const shortDate = (iso) => { const d = atNoon(iso); return `${DOW[d.getUTCDay()]}, ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`; };
const quizIdOf = (iso) => { const d = atNoon(iso); return `jig-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`; };
// The Monday of the week holding `iso`.
const mondayOf = (iso) => { const d = atNoon(iso); return isoOf(new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY_MS)); };
const thumb = (n, w) => `/api/jig/img?n=${n}&w=${w}`;

export default function ShelfClient({ boards, today, crumb, faq }) {
  const byDate = useMemo(() => new Map(boards.map((b) => [b.d, b])), [boards]);
  const todays = boards.find((b) => b.today) || null;
  const pastCount = boards.filter((b) => !b.today).length;

  // The shelves: one per Monday-to-Sunday week, from today's week back to the
  // week of the first board. A day after today is a locked box (the week is not
  // over yet); a day before the first board is an empty slot.
  const weeks = useMemo(() => {
    if (!boards.length) return [];
    const first = boards[boards.length - 1].d;
    const out = [];
    const thisMon = mondayOf(today);
    for (let mon = thisMon; mon >= mondayOf(first); mon = isoOf(new Date(atNoon(mon).getTime() - 7 * DAY_MS))) {
      const days = [];
      for (let k = 0; k < 7; k++) {
        const iso = isoOf(new Date(atNoon(mon).getTime() + k * DAY_MS));
        const b = byDate.get(iso);
        days.push(b ? { kind: 'box', b } : { kind: iso > today ? 'locked' : 'empty', iso });
      }
      const ago = Math.round((atNoon(thisMon) - atNoon(mon)) / (7 * DAY_MS));
      const label = ago === 0 ? 'This week' : ago === 1 ? 'Last week' : `Week of ${MON[atNoon(mon).getUTCMonth()]} ${atNoon(mon).getUTCDate()}`;
      out.push({ mon, label, days });
    }
    return out;
  }, [boards, byDate, today]);

  // Marks. `local` is read from this device's saves, then the server history
  // is merged over it.
  const [marks, setMarks] = useState({ solved: new Set(), played: new Set(), ready: false });
  useEffect(() => {
    migrateJigSaves();
    let alive = true;
    const solved = new Set();
    const played = new Set();
    for (const b of boards) {
      let sv = null;
      try { sv = JSON.parse(localStorage.getItem(`sot_jig_${b.n}`) || 'null'); } catch (e) { sv = null; }
      if (!sv || typeof sv !== 'object') continue;
      if (sv.status === 'won') { solved.add(b.n); played.add(b.n); }
      else if (sv.status && sv.status !== 'playing') played.add(b.n);
    }
    setMarks({ solved, played, ready: true });
    const byQuiz = new Map(boards.map((b) => [quizIdOf(b.d), b.n]));
    fetchDayStatus().then((d) => {
      if (!alive || !d) return;
      const s2 = new Set(solved);
      const p2 = new Set(played);
      const take = (list, set) => { for (const q of list || []) { const n = byQuiz.get(q); if (n) set.add(n); } };
      take(d.played, p2);
      take(d.completed, p2);
      take(d.completed, s2);
      setMarks({ solved: s2, played: p2, ready: true });
    }).catch(() => {});
    return () => { alive = false; };
  }, [boards]);

  // Today's picture shows only once THIS device holds a finished save for it.
  const [todayOpen, setTodayOpen] = useState(false);
  useEffect(() => {
    if (!todays) return;
    try {
      const sv = JSON.parse(localStorage.getItem(`sot_jig_${todays.n}`) || 'null');
      if (sv && sv.status && sv.status !== 'playing') setTodayOpen(true);
    } catch (e) {}
  }, [todays]);

  const [filter, setFilter] = useState('all');
  const counts = {
    all: boards.length,
    solved: boards.filter((b) => marks.solved.has(b.n)).length,
    unplayed: boards.filter((b) => !marks.played.has(b.n)).length,
    sun: boards.filter((b) => b.s).length,
  };
  const shows = (b) => (filter === 'all' ? true
    : filter === 'solved' ? marks.solved.has(b.n)
      : filter === 'unplayed' ? !marks.played.has(b.n)
        : !!b.s);

  // The open box: the newest past board until the reader picks one.
  const [sel, setSel] = useState(() => {
    const p = boards.find((b) => !b.today);
    return (p || boards[0] || {}).n || null;
  });
  const cur = boards.find((b) => b.n === sel) || null;
  const pick = (e, b) => {
    e.preventDefault();
    setSel(b.n);
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
      const el = document.getElementById('jsh-panel');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
    }
  };

  return (
    <CircuitFrame cat="Logic" label="Puzzle shelf" wide>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <nav className="jsh-crumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span aria-hidden="true">/</span>
        {crumb ? <><a href={crumb.href}>{crumb.label}</a><span aria-hidden="true">/</span></> : null}
        <a href="/jig">Jig</a><span aria-hidden="true">/</span>
        <span aria-current="page">Puzzle shelf</span>
      </nav>

      <header className="jsh-head">
        <div>
          <h1>Jig Puzzle Shelf: Every Daily Jigsaw</h1>
          <p className="jsh-lede">
            Every Jig so far, newest week first. Each box is one day&apos;s photograph, cut into 48 to 80 pieces.
            Pick any past box to play it free from the archive. Today&apos;s stays a question mark until you finish it.
          </p>
        </div>
        <a className="jsh-today" href="/jig">Play today&apos;s Jig</a>
      </header>

      <div className="jsh-chips" role="group" aria-label="Show">
        {[
          ['all', 'All'],
          ['solved', 'Solved'],
          ['unplayed', 'Not played'],
          ['sun', 'Sundays'],
        ].map(([k, lab]) => (
          <button key={k} type="button" className={filter === k ? 'on' : ''} aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {lab} <b>{marks.ready || k === 'all' || k === 'sun' ? counts[k] : '–'}</b>
          </button>
        ))}
      </div>

      <div className="jsh-grid">
        <section className="jsh-shelves" aria-label="The shelf, a week to a row">
          <div className="jsh-dow" aria-hidden="true">
            <span />
            <div className="jsh-dowr">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
          </div>
          {weeks.map((w) => (
            <div className="jsh-week" key={w.mon}>
              <div className="jsh-wlab">{w.label}</div>
              <div className="jsh-row">
                <div className="jsh-plank" aria-hidden="true" />
                {w.days.map((s, i) => {
                  if (s.kind !== 'box') return <span key={i} className={`jsh-slot ${s.kind}`} aria-hidden="true" />;
                  const b = s.b;
                  const solved = marks.solved.has(b.n);
                  const shut = b.today && !todayOpen;
                  const cls = ['jsh-box', b.s ? 'sun' : '', b.today ? 'today' : '', solved ? 'solved' : '',
                    sel === b.n ? 'sel' : '', shows(b) ? '' : 'off'].filter(Boolean).join(' ');
                  return (
                    <a key={i} className={cls} href={b.today ? '/jig' : `/jig?p=${b.n}`} onClick={(e) => pick(e, b)}
                      aria-label={b.today ? `Today, No. ${b.n}, ${b.c * b.r} pieces` : `No. ${b.n}, ${shortDate(b.d)}: ${b.name}, ${b.c * b.r} pieces${solved ? ', solved' : ''}`}>
                      <span className="jsh-lid"><span><span className="jsh-no">No. </span>{b.n}</span>{b.s ? <em>SUN</em> : null}</span>
                      <span className="jsh-pic">
                        {shut
                          ? <span className="jsh-q">?</span>
                          : <img src={thumb(b.n, 330)} alt={b.today ? '' : b.name} loading="lazy" decoding="async" />}
                      </span>
                      <span className="jsh-pc">{b.c * b.r}</span>
                      {solved ? <span className="jsh-tick" aria-hidden="true">{'✓'}</span> : null}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <aside className="jsh-panel" id="jsh-panel" aria-live="polite">
          {cur ? <Panel b={cur} solved={marks.solved.has(cur.n)} played={marks.played.has(cur.n)} todayOpen={todayOpen} /> : null}
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
        {pastCount + (todays ? 1 : 0)} puzzles so far, one new photograph every day at midnight Eastern.
        Every photo is a featured picture from <a href="https://commons.wikimedia.org/" rel="noopener">Wikimedia Commons</a>, credited on its box.
        Looking for another game? The <a href="/archive">puzzle archive</a> has every past board of every daily.
      </p>
    </CircuitFrame>
  );
}

function Panel({ b, solved, played, todayOpen }) {
  const pieces = b.c * b.r;
  if (b.today) {
    return (
      <div className="jsh-card">
        {todayOpen
          ? <img className="jsh-big" src={thumb(b.n, 960)} alt="Today's Jig picture" />
          : <div className="jsh-big jsh-bigq" aria-hidden="true">?</div>}
        <div className="jsh-meta">
          <div className="jsh-eye">No. {b.n} · Today{b.s ? ' · Sunday Edition' : ''}</div>
          <h2>{todayOpen ? 'Today’s picture' : 'Today’s picture is a surprise'}</h2>
          <p className="jsh-sub">{pieces} pieces · {b.c} × {b.r} cut</p>
          <p className="jsh-note">
            {todayOpen
              ? 'You finished it on this device, so its box shows the photo.'
              : 'The shelf keeps today covered. Finish it and the box shows the photograph.'}
          </p>
          <a className="jsh-cta" href="/jig">{todayOpen ? 'Back to today’s Jig' : 'Play today’s Jig'}</a>
        </div>
      </div>
    );
  }
  return (
    <div className="jsh-card">
      <img className="jsh-big" src={thumb(b.n, 960)} alt={b.name} />
      <div className="jsh-meta">
        <div className="jsh-eye">No. {b.n} · {shortDate(b.d)}{b.s ? ' · Sunday Edition' : ''}</div>
        <h2>{b.name}</h2>
        <p className="jsh-credit">
          Photo: {b.by} · {b.lic} · <a href={b.src} rel="noopener" target="_blank">Wikimedia Commons</a>
        </p>
        <dl className="jsh-facts">
          <div><dt>Pieces</dt><dd>{pieces}</dd></div>
          <div><dt>Cut</dt><dd>{b.c} × {b.r}</dd></div>
          <div><dt>You</dt><dd className={solved ? 'good' : ''}>{solved ? 'Solved' : played ? 'Played' : 'Not played'}</dd></div>
        </dl>
        <a className="jsh-cta" href={`/jig?p=${b.n}`}>{solved || played ? 'Play it again' : 'Play from the archive'}</a>
      </div>
    </div>
  );
}

// A JS template literal: no backticks inside, and no apostrophes either, since
// a quote in a stylesheet rendered by a server page is the escaping trap
// CircuitFrame describes.
const CSS = `
.jsh-crumb{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12.5px;font-weight:700;color:var(--stg-mute);margin-bottom:14px;}
.jsh-crumb a{color:var(--stg-ink2);text-decoration:none;}
.jsh-crumb a:hover{color:var(--stg-ink);text-decoration:underline;}
.jsh-crumb span[aria-current]{color:var(--stg-ink);}

.jsh-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:16px;}
.jsh-head h1{margin:0;font-size:32px;line-height:1.08;font-weight:800;letter-spacing:-0.02em;color:var(--stg-ink);}
.jsh-lede{margin:8px 0 0;max-width:640px;font-size:15px;line-height:1.5;font-weight:600;color:var(--stg-ink2);}
.jsh-today{flex:none;text-decoration:none;font-size:14px;font-weight:800;padding:12px 18px;border-radius:10px;
  background:var(--stg-acc);color:var(--stg-onramp,#08222e);}
.jsh-today:hover{filter:brightness(1.06);}

.jsh-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px;}
.jsh-chips button{font:inherit;font-size:13px;font-weight:800;padding:8px 13px;border-radius:999px;cursor:pointer;
  background:var(--stg-surf);color:var(--stg-ink2);border:1px solid var(--stg-line);}
.jsh-chips button b{font-weight:800;color:var(--stg-mute);margin-left:3px;}
.jsh-chips button.on{background:var(--stg-ink);color:var(--stg-ground);border-color:var(--stg-ink);}
.jsh-chips button.on b{color:var(--stg-ground);opacity:.75;}

.jsh-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:26px;align-items:start;}
.jsh-shelves{min-width:0;padding:14px 14px 4px;border-radius:14px;background:var(--stg-surf);border:1px solid var(--stg-line);}
.jsh-dow,.jsh-week{display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;align-items:end;}
.jsh-dow{margin-bottom:6px;}
.jsh-dowr{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;}
.jsh-dowr span{text-align:center;font-size:11px;font-weight:800;letter-spacing:.1em;color:var(--stg-mute);}
.jsh-week{margin-bottom:22px;}
.jsh-wlab{font-size:12px;font-weight:800;color:var(--stg-ink2);padding-bottom:16px;line-height:1.2;}
.jsh-row{position:relative;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;align-items:end;padding-bottom:9px;}
.jsh-plank{position:absolute;left:-8px;right:-8px;bottom:0;height:9px;border-radius:2px;
  background:#8a6440;border-top:3px solid #a87d55;box-shadow:0 3px 0 #5c4029;}

.jsh-slot{display:block;aspect-ratio:3/2.5;}
.jsh-slot.locked{border:1.5px dashed var(--stg-line);border-radius:4px;opacity:.9;}
.jsh-box{position:relative;display:flex;flex-direction:column;text-decoration:none;border-radius:4px;overflow:hidden;
  background:#1b2436;box-shadow:3px 3px 0 rgba(5,7,13,.55);transition:transform .15s ease, opacity .15s ease;}
.jsh-box:hover{transform:translateY(-3px);}
.jsh-box:focus-visible{outline:3px solid var(--stg-acc);outline-offset:3px;}
.jsh-box.sel{outline:3px solid var(--stg-ink);outline-offset:2px;}
.jsh-box.off{opacity:.22;}
.jsh-lid{display:flex;align-items:center;justify-content:space-between;gap:4px;height:15px;padding:0 5px;
  font-size:9.5px;font-weight:800;letter-spacing:.04em;background:#2b3a55;color:#ffffff;white-space:nowrap;overflow:hidden;}
.jsh-lid em{font-style:normal;letter-spacing:.08em;}
.jsh-box.sun .jsh-lid{background:#d9a441;color:#241703;}
.jsh-pic{display:block;position:relative;aspect-ratio:3/2;background:#111827;}
.jsh-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
.jsh-q{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;
  color:#ffffff;background:#1b2c52;}
.jsh-box.today{box-shadow:0 0 0 2px var(--stg-acc), 3px 3px 0 rgba(5,7,13,.55);}
.jsh-pc{position:absolute;right:4px;bottom:4px;font-size:9.5px;font-weight:800;padding:1px 5px;border-radius:7px;
  background:#f3efe4;color:#1a1f2b;}
.jsh-tick{position:absolute;left:4px;bottom:4px;width:15px;height:15px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:9.5px;font-weight:800;background:#1f9d63;color:#ffffff;}

.jsh-panel{position:sticky;top:16px;}
.jsh-card{border-radius:14px;overflow:hidden;background:var(--stg-surf);border:1px solid var(--stg-line);}
.jsh-big{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;background:#111827;}
.jsh-bigq{display:flex;align-items:center;justify-content:center;font-size:64px;font-weight:800;color:#ffffff;background:#1b2c52;}
.jsh-meta{padding:14px 16px 16px;}
.jsh-eye{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-acc-ink,var(--stg-acc));}
.jsh-meta h2{margin:4px 0 0;font-size:20px;line-height:1.2;font-weight:800;color:var(--stg-ink);}
.jsh-credit,.jsh-sub,.jsh-note{margin:6px 0 0;font-size:13px;line-height:1.45;font-weight:600;color:var(--stg-ink2);}
.jsh-credit a{color:var(--stg-ink2);}
.jsh-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0 0;}
.jsh-facts div{padding:8px 10px;border-radius:9px;background:var(--stg-surf2);}
.jsh-facts dt{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--stg-mute);}
.jsh-facts dd{margin:2px 0 0;font-size:15px;font-weight:800;color:var(--stg-ink);}
.jsh-facts dd.good{color:var(--stg-good);}
.jsh-cta{display:block;margin-top:14px;text-align:center;text-decoration:none;font-size:15px;font-weight:800;padding:13px;
  border-radius:10px;background:var(--stg-acc);color:var(--stg-onramp,#08222e);}
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
}
@media (max-width:640px){
  .jsh-head{flex-direction:column;align-items:stretch;}
  .jsh-head h1{font-size:25px;}
  .jsh-lede{font-size:14px;}
  .jsh-today{text-align:center;}
  .jsh-chips{gap:6px;}
  .jsh-chips button{padding:7px 10px;font-size:12px;}
  .jsh-shelves{padding:10px 8px 2px;}
  .jsh-dow{grid-template-columns:minmax(0,1fr);}
  .jsh-dow > span{display:none;}
  .jsh-dowr{gap:6px;}
  .jsh-week{grid-template-columns:minmax(0,1fr);gap:4px;margin-bottom:16px;}
  .jsh-wlab{padding-bottom:0;font-size:11px;color:var(--stg-mute);}
  .jsh-row{gap:6px;padding-bottom:7px;}
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
