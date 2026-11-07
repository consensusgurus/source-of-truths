'use client';

// THE RUN BUILDER (owner, 2026-11-07). Name the run, pick 2 to 8 of today's
// dailies, order them, then Review and Share hands the maker to the run's own
// page with the link ready to send. Nothing is saved on the server: the link
// is the run (lib/daily-run.js), and this browser remembers it for My Puzzles.
import { useEffect, useMemo, useState } from 'react';
import CircuitFrame from '../circuits/CircuitFrame';
import GameGlyph from '../GameGlyph';
import { RUN_MAX, BUILT_MIN, cleanRunName, builtRunHref, rememberRun } from '@/lib/daily-run';
import { savedIdentity } from '@/lib/saved-identity';
import { catWord, hueVars, CSS as RUN_CSS } from '../run/RunPageClient';

// Category order as the home's index reads it.
const CAT_ORDER = ['Word', 'Numbers', 'Logic', 'Sudoku', 'Trivia', 'Geography', 'Cards', 'Crowd Psychology', 'Arcade', 'End Game'];

export default function BuildRunClient({ games = [], start = [], startName = '' }) {
  const byKey = useMemo(() => Object.fromEntries(games.map((g) => [g.key, g])), [games]);
  const [picked, setPicked] = useState(start);
  const [name, setName] = useState(startName);
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [maker, setMaker] = useState('');
  useEffect(() => { setMaker(savedIdentity().username || ''); }, []);

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
    const meta = { name: cleanRunName(name) || 'My Run', by: maker };
    rememberRun(picked, meta, true);
    window.location.href = builtRunHref(picked, meta) + '&new=1';
  };

  return (
    <CircuitFrame label="Build a Run" bar={{ title: 'Build a Run', sub: 'Runs' }}>
      <style dangerouslySetInnerHTML={{ __html: RUN_CSS + CSS }} />
      <div className="br">
        <div className="br-head">
          {/* The header carries the page's name; no second title under it. */}
          <p className="br-sub">Pick {BUILT_MIN} to {RUN_MAX} of today&rsquo;s puzzles, put them in order and send the link.</p>
        </div>

        <div className="bb-field">
          <label htmlFor="bb-name">Run Name</label>
          <input id="bb-name" value={name} maxLength={28} placeholder="My Run" autoComplete="off"
            onChange={(e) => setName(e.target.value)} />
        </div>

        <section aria-label="Your run, in order">
          <div className="bb-lab"><span>Your Run, In Order</span><span>{picked.length === 1 ? '1 Game' : `${picked.length} Games`} · Up to {RUN_MAX}</span></div>
          <div className="br-card bb-tray">
            {!picked.length ? <div className="br-msg">Tap games below to add them.</div> : null}
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

        <section aria-label="Add games">
          <div className="bb-lab"><span>Add Games</span>{full ? <span>Your run is full</span> : null}</div>
          <div className="bb-chips">
            {cats.map((c) => (
              <button key={c} type="button" className={'bb-chip' + (cat === c ? ' on' : '')} aria-pressed={cat === c} onClick={() => setCat(c)}>{c === 'All' ? 'All' : catWord(c)}</button>
            ))}
          </div>
          <div className="bb-search">
            <label htmlFor="bb-q" className="bb-sr">Search games</label>
            <input id="bb-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games" autoComplete="off" />
          </div>
          <div className="br-card bb-list">
            {!list.length ? <div className="br-msg">No games match.</div> : null}
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
          {!maker ? <p className="br-tiny bb-anon">Play under a name and your results become the ones your friends try to beat. <a href="/?signup=1">Choose a Name</a></p> : null}
          <button type="button" className="br-go" onClick={go} disabled={!ready}>{ready ? 'Review and Share' : `Pick at least ${BUILT_MIN} games`}</button>
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
