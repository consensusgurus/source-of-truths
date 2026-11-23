'use client';

// BUILD YOUR DAY (owner, 2026-11-21: "Instead of Build Your Run, the site
// replaces that with Build Your Day ... should use the old build your run
// wiring and replace it"). The run builder of 2026-11-07, now picking the
// puzzles for MIND LOFT DAILY: any number (RUN_MAX is only the board's
// ceiling), in order, no name. Save My Day keeps them in this browser
// (lib/daily-run.js saveMyDay) and opens the paper at /my-day. Nothing is
// saved on the server. ?g=a,b prefills it; with no ?g it opens on the saved day.
import { useEffect, useMemo, useState } from 'react';
import CircuitFrame from '../circuits/CircuitFrame';
import GameGlyph from '../GameGlyph';
import { RUN_MAX, BUILT_MIN, getMyDay, saveMyDay, countDayEvent, trackMyDay } from '@/lib/daily-run';
import { catWord, hueVars, CSS as RUN_CSS } from '../run/RunPageClient';

// Category order as the home's index reads it.
const CAT_ORDER = ['Word', 'Numbers', 'Logic', 'Visual', 'Sudoku', 'Trivia', 'Geography', 'Table Games', 'Crowd Psychology', 'Arcade'];

export default function BuildRunClient({ games = [], start = [] }) {
  const byKey = useMemo(() => Object.fromEntries(games.map((g) => [g.key, g])), [games]);
  const [picked, setPicked] = useState(start);
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [had, setHad] = useState(false);
  // No ?g: open on the day this browser already keeps, so Edit is the same page.
  useEffect(() => {
    const mine = getMyDay().filter((k) => byKey[k]);
    if (mine.length) setHad(true);
    if (!start.length && mine.length) setPicked(mine);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cats = useMemo(() => {
    const have = new Set(games.map((g) => g.cat));
    return ['All', ...CAT_ORDER.filter((c) => have.has(c)), ...[...have].filter((c) => !CAT_ORDER.includes(c))];
  }, [games]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return games
      .filter((g) => (cat === 'All' || g.cat === cat) && (!needle || g.name.toLowerCase().includes(needle) || (g.tag || '').toLowerCase().includes(needle)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [games, cat, q]);

  const toggle = (k) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : (p.length >= RUN_MAX ? p : [...p, k])));
  const move = (i, d) => setPicked((p) => {
    const j = i + d;
    if (j < 0 || j >= p.length) return p;
    const n = p.slice();
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });
  const ready = picked.length >= BUILT_MIN;
  const full = picked.length >= RUN_MAX;
  const go = () => {
    if (!ready) return;
    saveMyDay(picked);
    countDayEvent(had ? 'my-day-edited' : 'my-day-saved');
    trackMyDay(had ? 'edited' : 'saved', picked);
    window.location.href = '/my-day';
  };

  return (
    <CircuitFrame label="Build Your Day" bar={{ title: 'Build Your Day', sub: 'Mind Loft Daily' }}>
      <style dangerouslySetInnerHTML={{ __html: RUN_CSS + CSS }} />
      <div className="br">
        <div className="br-head">
          {/* The header carries the page's name; no second title under it. */}
          <p className="br-sub">Pick the puzzles you want, as many as you like. They arrive every day as one paper, in this order.</p>
        </div>

        <section aria-label="Your day, in order">
          <div className="bb-lab"><span>Your Day, In Order</span><span>{picked.length === 1 ? '1 Puzzle' : `${picked.length} Puzzles`}{full ? '' : ' · No Limit'}</span></div>
          <div className="br-card bb-tray">
            {!picked.length ? <div className="br-msg">Tap puzzles below to add them.</div> : null}
            {picked.map((k, i) => {
              const g = byKey[k];
              if (!g) return null;
              return (
                <div key={k} className="bb-t">
                  <span className="bb-n">{i + 1}</span>
                  <span className="br-sw sm" style={hueVars(k)}><GameGlyph gameKey={k} size={15} /></span>
                  <span className="br-rt"><b>{g.name}</b><small>{catWord(g.cat)}</small></span>
                  <button type="button" className="bb-ic" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${g.name} up`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6" /></svg>
                  </button>
                  <button type="button" className="bb-ic" onClick={() => move(i, 1)} disabled={i === picked.length - 1} aria-label={`Move ${g.name} down`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                  <button type="button" className="bb-ic" onClick={() => toggle(k)} aria-label={`Remove ${g.name}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-label="Add puzzles">
          <div className="bb-lab"><span>Add Puzzles</span>{full ? <span>That is every puzzle a day can hold</span> : null}</div>
          <div className="bb-chips">
            {cats.map((c) => (
              <button key={c} type="button" className={'bb-chip' + (cat === c ? ' on' : '')} aria-pressed={cat === c} onClick={() => setCat(c)}>{c === 'All' ? 'All' : catWord(c)}</button>
            ))}
          </div>
          <div className="bb-search">
            <label htmlFor="bb-q" className="bb-sr">Search puzzles</label>
            <input id="bb-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search puzzles" autoComplete="off" />
          </div>
          <div className="br-card bb-list">
            {!list.length ? <div className="br-msg">No puzzles match.</div> : null}
            {list.map((g) => {
              const on = picked.includes(g.key);
              return (
                <button key={g.key} type="button" className={'bb-g' + (on ? ' on' : '')} aria-pressed={on}
                  aria-label={`${on ? 'Remove' : 'Add'} ${g.name}`} disabled={!on && full} onClick={() => toggle(g.key)}>
                  <span className="br-sw" style={hueVars(g.key)}><GameGlyph gameKey={g.key} size={18} /></span>
                  <span className="br-rt"><b>{g.name}</b><small>{catWord(g.cat)} · {g.tag}</small></span>
                  <span className={'bb-dot' + (on ? ' on' : '')} aria-hidden="true">
                    {on
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="bb-bar">
          <p className="br-tiny bb-anon">Your day is kept on this device and waits for you every day. Change it any time.</p>
          <button type="button" className="br-go" onClick={go} disabled={!ready}>{ready ? 'Save My Day' : `Pick at least ${BUILT_MIN} puzzles`}</button>
        </div>
      </div>
    </CircuitFrame>
  );
}

const CSS = `
.bb-field{display:flex;flex-direction:column;gap:6px;}
.bb-field label,.bb-lab{font-size:12px;font-weight:700;color:var(--stg-mute);}
.bb-field input,.bb-search input{height:46px;box-sizing:border-box;border:1px solid var(--stg-ink);border-radius:12px;background:var(--stg-surf);
  padding:0 14px;font-family:inherit;font-size:17px;font-weight:700;color:var(--stg-ink);width:100%;}
.bb-search input{font-size:15px;font-weight:600;height:44px;}
.bb-field input::placeholder,.bb-search input::placeholder{color:var(--stg-mute);font-weight:600;}
.bb-field input:focus,.bb-search input:focus{outline:2px solid var(--stg-ink);outline-offset:1px;}
.bb-lab{display:flex;justify-content:space-between;align-items:baseline;margin:0 2px 8px;}
.bb-tray{max-height:none;}
.bb-t{display:flex;align-items:center;gap:10px;padding:6px 6px 6px 12px;border-bottom:1px solid var(--stg-line);}
.bb-t:last-child{border-bottom:0;}
.bb-n{width:18px;text-align:center;font-size:13px;font-weight:800;color:var(--stg-mute);}
.bb-ic{flex:none;width:40px;height:44px;border:0;background:transparent;color:var(--stg-ink);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;}
.bb-ic:hover:not(:disabled){background:var(--stg-surf2);}
.bb-ic:disabled{opacity:.25;cursor:default;}
.bb-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
.bb-chip{height:34px;padding:0 13px;border-radius:17px;border:1px solid var(--stg-ink);background:transparent;color:var(--stg-ink);font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;}
.bb-chip.on{background:var(--stg-ink);color:var(--stg-ground);}
.bb-search{margin-bottom:10px;}
.bb-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}
.bb-list{max-height:min(460px,58vh);overflow-y:auto;overscroll-behavior:contain;}
.bb-g{border-radius:0;display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border:0;border-bottom:1px solid var(--stg-line);background:transparent;color:var(--stg-ink);
  font-family:inherit;text-align:left;cursor:pointer;min-height:58px;box-sizing:border-box;}
.bb-g:last-child{border-bottom:0;}
.bb-g:hover:not(:disabled){background:var(--stg-surf2);}
.bb-g.on{background:var(--stg-surf2);}
.bb-g:disabled{opacity:.45;cursor:default;}
.bb-dot{flex:none;width:30px;height:30px;border-radius:15px;border:1px solid var(--stg-ink);display:inline-flex;align-items:center;justify-content:center;color:var(--stg-ink);}
.bb-dot.on{background:var(--stg-ink);color:var(--stg-ground);}
.bb-bar{position:sticky;bottom:0;z-index:3;padding:12px 0 14px;background:var(--stg-ground);display:flex;flex-direction:column;gap:8px;}
.bb-anon{margin:0;}
.bb-anon a{color:var(--stg-ink);font-weight:800;}
.br-go:disabled{background:var(--stg-surf2);color:var(--stg-mute);cursor:default;filter:none;}
`;
