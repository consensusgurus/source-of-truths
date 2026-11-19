'use client';
// THE IDEA BOARD, /community/ideas (owner, 2026-11-18: "make it the idea board,
// pitching ideas"). Pitch a New Puzzle, a Variation of one you play, or a Site
// Fix. One vote per idea. Stages: Open For Votes, Under Review, In The
// Workshop (renamed Building, owner 2026-11-18), Built. It took the place of "Submit or List a Puzzle" in the index;
// that form still exists for makers sending a finished puzzle or a site, and
// this page links to it.
//
// ?pitch=puzzle|variation|fix&game=<key> opens the form with that type (the
// endings' "Suggest A <Game> Idea" lands here as a Variation of that game).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CommunityShell from './CommunityShell';
import { getIdeas, ideaAction, ago } from './communityClient';
import { IDEA_KINDS, IDEA_STAGES } from './communityShared';
import { ensureAccount, readIdentity, suggestName } from '../groups/GroupsShell';
import { DAILY_GAMES } from '@/lib/daily-games';

const STAGE_TONE = { open: 'var(--cm-sky)', review: 'var(--cm-peach)', workshop: 'var(--cm-violet)', built: 'var(--cm-green)' };

export default function IdeasClient({ pitch = null, game = null }) {
  const [data, setData] = useState(null);
  const [stage, setStage] = useState('');
  const [kind, setKind] = useState('');
  const [sort, setSort] = useState('top');
  const [form, setForm] = useState(() => ({ open: !!pitch, kind: IDEA_KINDS[pitch] ? pitch : 'puzzle', title: '', body: '', game: game || '' }));
  const [nm, setNm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ err: '', ok: '' });
  const load = useCallback(() => { getIdeas({ sort }).then(setData); }, [sort]);
  useEffect(() => { setNm(readIdentity().username || suggestName()); }, []);
  useEffect(() => { load(); }, [load]);
  const games = useMemo(() => [...DAILY_GAMES].sort((a, b) => a.name.localeCompare(b.name)), []);
  const gameName = (k) => { const g = DAILY_GAMES.find((x) => x.key === k); return g ? g.name : ''; };

  const all = (data && data.ideas) || [];
  const shown = all.filter((i) => (!stage || i.stage === stage) && (!kind || i.kind === kind));
  const needName = data && !data.username;
  const counts = (data && data.counts) || {};

  const vote = async (i) => {
    setMsg({ err: '', ok: '' });
    if (needName) {
      const a = await ensureAccount(nm);
      if (a.error) { setMsg({ err: a.error, ok: '' }); return; }
    }
    const r = await ideaAction('vote', { id: i.id, on: !i.voted });
    if (r.error) { setMsg({ err: r.error, ok: '' }); return; }
    load();
  };
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setMsg({ err: '', ok: '' });
    setBusy(true);
    if (needName) {
      const a = await ensureAccount(nm);
      if (a.error) { setMsg({ err: a.error, ok: '' }); setBusy(false); return; }
    }
    const r = await ideaAction('pitch', { kind: form.kind, title: form.title, body: form.body, game: form.kind === 'variation' ? form.game : '' });
    setBusy(false);
    if (r.error) { setMsg({ err: r.error, ok: '' }); return; }
    setForm({ open: false, kind: 'puzzle', title: '', body: '', game: '' });
    setMsg({ err: '', ok: 'Pitched. Your idea is open for votes.' });
    load();
  };
  const adminAct = async (action, extra) => { const r = await ideaAction(action, extra); if (r.error) setMsg({ err: r.error, ok: '' }); else load(); };

  return (
    <CommunityShell tab="ideas" title="Idea Board"
      sub="Pitch a new puzzle, a twist on one you play, or a fix for the site. Vote for the ones you want. When we build an idea, the person who pitched it gets Pitched By credit on the puzzle."
      aside={<button type="button" className="cm-btn pri" onClick={() => setForm((f) => ({ ...f, open: !f.open }))}>{form.open ? 'Close' : 'Pitch An Idea'}</button>}>
      {data && data.available === false ? <p className="cm-mut" style={{ marginBottom: 16 }}>The Idea Board is being set up. Pitching opens shortly.</p> : null}
      {form.open ? (
        <form className="cm-card" onSubmit={submit} style={{ marginBottom: 20 }}>
          <div className="cm-ch"><b>Pitch An Idea</b><span>Five a day</span></div>
          <div className="cm-cb">
            <div className="cm-seg" role="group" aria-label="Type of idea">
              {Object.entries(IDEA_KINDS).map(([k, l]) => (
                <button key={k} type="button" className={form.kind === k ? 'on' : ''} aria-pressed={form.kind === k} onClick={() => setForm((f) => ({ ...f, kind: k }))}>{l}</button>
              ))}
            </div>
            {form.kind === 'variation' ? (
              <label className="cm-lab">Which puzzle
                <select className="cm-in" value={form.game} onChange={(e) => setForm((f) => ({ ...f, game: e.target.value }))}>
                  <option value="">Pick a puzzle</option>
                  {games.map((g) => <option key={g.key} value={g.key}>{g.name}</option>)}
                </select>
              </label>
            ) : null}
            <label className="cm-lab">Title
              <input className="cm-in" value={form.title} maxLength={90} placeholder={form.kind === 'fix' ? 'What should we fix?' : form.kind === 'variation' ? `${gameName(form.game) || 'Mop'} with a twist` : 'A daily where you...'}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </label>
            <label className="cm-lab">Details (optional)
              <textarea className="cm-in" rows={3} maxLength={800} value={form.body} placeholder="How would it play? What makes it fun?"
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
            </label>
            {needName ? (
              <label className="cm-lab">Your name on the board
                <input className="cm-in" style={{ maxWidth: 260 }} value={nm} maxLength={15} onChange={(e) => setNm(e.target.value)} />
              </label>
            ) : null}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="submit" className="cm-btn dk" disabled={busy}>{busy ? 'Pitching…' : 'Pitch It'}</button>
              <span className="cm-mut" style={{ fontSize: 12.5 }}>Made a finished puzzle, or run a puzzle site? <Link href="/submit-a-puzzle" style={{ color: 'var(--stg-ink)', fontWeight: 800 }}>Submit it here</Link>.</span>
            </div>
          </div>
        </form>
      ) : null}
      {msg.err ? <p className="cm-err" style={{ marginBottom: 12 }}>{msg.err}</p> : null}
      {msg.ok ? <p className="cm-ok" style={{ marginBottom: 12 }}>{msg.ok}</p> : null}
      <div className="cm-seg" role="group" aria-label="Stage" style={{ marginBottom: 12 }}>
        <button type="button" className={!stage ? 'on' : ''} onClick={() => setStage('')}>All <i>{counts.all || 0}</i></button>
        {Object.entries(IDEA_STAGES).map(([k, l]) => (
          <button key={k} type="button" className={stage === k ? 'on' : ''} onClick={() => setStage(k)}>{l} <i>{counts[k] || 0}</i></button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
        <div className="cm-seg" role="group" aria-label="Type">
          <button type="button" className={!kind ? 'on' : ''} onClick={() => setKind('')}>Every Type</button>
          {Object.entries(IDEA_KINDS).map(([k, l]) => <button key={k} type="button" className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{l}</button>)}
        </div>
        <div className="cm-seg" role="group" aria-label="Sort">
          <button type="button" className={sort === 'top' ? 'on' : ''} onClick={() => setSort('top')}>Most Votes</button>
          <button type="button" className={sort === 'new' ? 'on' : ''} onClick={() => setSort('new')}>Newest</button>
        </div>
        {needName && !form.open ? (
          <label className="cm-lab" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>Voting as
            <input className="cm-in" style={{ width: 170 }} value={nm} maxLength={15} onChange={(e) => setNm(e.target.value)} />
          </label>
        ) : null}
      </div>
      {!data ? <p className="cm-mut">Loading ideas&hellip;</p> : shown.length ? (
        <div className="cm-g2">
          {shown.map((i) => (
            <article key={i.id} id={`idea-${i.id}`} className="cm-card" style={i.hidden ? { opacity: 0.55 } : undefined}>
              <div className="cm-ch" style={{ background: STAGE_TONE[i.stage] }}>
                <b>{i.stageLabel}</b>
                <span>{i.kindLabel}{i.game ? ` · ${i.game.name}` : ''}</span>
              </div>
              <div className="cm-cb" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                <button type="button" className={'cm-btn' + (i.voted ? ' dk' : '')} aria-pressed={i.voted} onClick={() => vote(i)}
                  style={{ flexDirection: 'column', minWidth: 64, minHeight: 64, padding: '6px 10px', gap: 0 }}
                  aria-label={i.voted ? `Remove your vote. ${i.votes} votes` : `Vote. ${i.votes} votes`}>
                  <span style={{ fontSize: 20 }}>{i.votes}</span><span style={{ fontSize: 11.5 }}>{i.voted ? 'Voted' : 'Vote'}</span>
                </button>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <b style={{ fontSize: 16.5, fontWeight: 800, lineHeight: 1.3 }}>{i.title}</b>
                  {i.body ? <p className="cm-mut" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{i.body}</p> : null}
                  <span className="cm-mut" style={{ fontSize: 12.5 }}>Pitched by {i.mine ? 'you' : i.name} &middot; {ago(i.at)}{i.hidden ? ` · Hidden (${i.reports} reports)` : ''}</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {!i.mine ? <button type="button" className="cm-btn" style={{ minHeight: 32, padding: '0 10px', fontSize: 12.5 }} onClick={async () => { const r = await ideaAction('report', { id: i.id }); setMsg(r.error ? { err: r.error, ok: '' } : { err: '', ok: 'Thanks. The idea was reported.' }); }}>Report</button> : null}
                    {data.admin ? (
                      <>
                        <select className="cm-in" style={{ width: 'auto', padding: '5px 8px', fontSize: 12.5 }} value={i.stage} onChange={(e) => adminAct('stage', { id: i.id, stage: e.target.value })} aria-label="Stage">
                          {Object.entries(IDEA_STAGES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                        <button type="button" className="cm-btn" style={{ minHeight: 32, padding: '0 10px', fontSize: 12.5 }} onClick={() => adminAct('hide', { id: i.id, hidden: !i.hidden })}>{i.hidden ? 'Restore' : 'Hide'}</button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="cm-card"><div className="cm-cb"><p className="cm-mut">{all.length ? 'No ideas match those filters.' : 'No ideas yet. Be the first to pitch one.'}</p></div></div>}
    </CommunityShell>
  );
}
