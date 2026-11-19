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
//
// COMMENTS (owner, 2026-11-19: "Need a way to comment on here"): every idea has
// a Comment button that opens its thread under the card. The thread opens by
// itself for #idea-N links (the bottom notice, app/community/CommentNotice.jsx)
// and on your own ideas with comments you have not seen; loading the board
// marks those seen, so the notice does not come back.
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
  const [openThreads, setOpenThreads] = useState(() => new Set());
  const [drafts, setDrafts] = useState({});
  const [posting, setPosting] = useState(0);
  const [editing, setEditing] = useState({ id: 0, text: '' });   // your own comment being edited
  const [delAsk, setDelAsk] = useState('');                      // 'idea-N' / 'c-N': Delete tapped once, waiting for Confirm
  const load = useCallback(() => { getIdeas({ sort }).then(setData); }, [sort]);
  useEffect(() => { setNm(readIdentity().username || suggestName()); }, []);
  useEffect(() => { load(); }, [load]);

  // Open the linked thread (#idea-N) and your own threads with unseen
  // comments, then mark those seen.
  useEffect(() => {
    if (!data || !data.ideas) return;
    let hashId = 0;
    try { const m = /^#idea-(\d+)$/.exec(window.location.hash || ''); if (m) hashId = Number(m[1]); } catch (e) { /* none */ }
    const fresh = data.ideas.filter((i) => i.mine && (i.comments || []).some((c) => c.fresh)).map((i) => i.id);
    if (hashId || fresh.length) {
      setOpenThreads((prev) => { const n = new Set(prev); if (hashId) n.add(hashId); fresh.forEach((id) => n.add(id)); return n; });
    }
    if (hashId) {
      setTimeout(() => { try { const el = document.getElementById(`idea-${hashId}`); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { /* ignore */ } }, 60);
    }
    if (fresh.length) {
      ideaAction('seen', { ids: fresh }).then(() => {
        try { window.dispatchEvent(new CustomEvent('sot:idea-comments-seen', { detail: { ids: fresh } })); } catch (e) { /* ignore */ }
      });
    }
  }, [data]);
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
  const toggleThread = (id) => setOpenThreads((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const sendComment = async (i) => {
    const text = (drafts[i.id] || '').trim();
    if (!text || posting) return;
    setMsg({ err: '', ok: '' });
    setPosting(i.id);
    if (needName) {
      const a = await ensureAccount(nm);
      if (a.error) { setMsg({ err: a.error, ok: '' }); setPosting(0); return; }
    }
    const r = await ideaAction('comment', { id: i.id, body: text });
    setPosting(0);
    if (r.error) { setMsg({ err: r.error, ok: '' }); return; }
    setDrafts((d) => ({ ...d, [i.id]: '' }));
    load();
  };
  // Delete takes two taps (Delete, then Confirm Delete), never a browser dialog.
  const askDel = (key, run) => { if (delAsk !== key) { setDelAsk(key); return; } setDelAsk(''); run(); };
  const saveEdit = async () => {
    const text = editing.text.trim();
    if (!text || posting) return;
    setPosting(-editing.id);
    const r = await ideaAction('editComment', { id: editing.id, body: text });
    setPosting(0);
    if (r.error) { setMsg({ err: r.error, ok: '' }); return; }
    setEditing({ id: 0, text: '' });
    load();
  };
  const adminAct = async (action, extra) => { const r = await ideaAction(action, extra); if (r.error) setMsg({ err: r.error, ok: '' }); else load(); };

  return (
    <>
    <style>{IB_CSS}</style>
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
                    {data.commentsOn ? (
                      <button type="button" className={'cm-btn' + (openThreads.has(i.id) ? ' pri' : '')} aria-expanded={openThreads.has(i.id)} aria-controls={`idea-${i.id}-thread`}
                        style={{ minHeight: 32, padding: '0 10px', fontSize: 12.5 }} onClick={() => toggleThread(i.id)}>
                        {openThreads.has(i.id) ? 'Hide Comments' : (i.comments || []).length ? `${i.comments.length} ${i.comments.length === 1 ? 'Comment' : 'Comments'}` : 'Comment'}
                      </button>
                    ) : null}
                    {!i.mine ? <button type="button" className="cm-btn" style={{ minHeight: 32, padding: '0 10px', fontSize: 12.5 }} onClick={async () => { const r = await ideaAction('report', { id: i.id }); setMsg(r.error ? { err: r.error, ok: '' } : { err: '', ok: 'Thanks. The idea was reported.' }); }}>Report</button> : null}
                    {data.admin ? (
                      <>
                        <select className="cm-in" style={{ width: 'auto', padding: '5px 8px', fontSize: 12.5 }} value={i.stage} onChange={(e) => adminAct('stage', { id: i.id, stage: e.target.value })} aria-label="Stage">
                          {Object.entries(IDEA_STAGES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                        <button type="button" className="cm-btn" style={{ minHeight: 32, padding: '0 10px', fontSize: 12.5 }} onClick={() => adminAct('hide', { id: i.id, hidden: !i.hidden })}>{i.hidden ? 'Restore' : 'Hide'}</button>
                        <button type="button" className="cm-btn" style={{ minHeight: 32, padding: '0 10px', fontSize: 12.5 }} onClick={() => askDel(`idea-${i.id}`, () => adminAct('delete', { id: i.id }))}>{delAsk === `idea-${i.id}` ? 'Confirm Delete' : 'Delete'}</button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              {data.commentsOn && openThreads.has(i.id) ? (
                <div id={`idea-${i.id}-thread`} className="ib-thread">
                  {(i.comments || []).length ? (
                    <ul className="ib-list">
                      {i.comments.map((c) => (
                        <li key={c.id} className={'ib-c' + (c.fresh ? ' fresh' : '')} style={c.hidden ? { opacity: 0.55 } : undefined}>
                          <div className="ib-meta"><b>{c.mine ? 'You' : c.name}</b><span>{ago(c.at)}{c.edited ? ' · Edited' : ''}{c.fresh ? ' · New' : ''}{c.hidden ? ` · Hidden (${c.reports} reports)` : ''}</span></div>
                          {editing.id === c.id ? (
                            <form className="ib-form" onSubmit={(e) => { e.preventDefault(); saveEdit(); }}>
                              <textarea className="cm-in" rows={2} maxLength={500} value={editing.text} aria-label="Edit your comment" autoFocus
                                onChange={(e) => { const v = e.target.value; setEditing((x) => ({ ...x, text: v })); }} />
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button type="submit" className="cm-btn dk" disabled={!editing.text.trim() || posting === -c.id}>{posting === -c.id ? 'Saving…' : 'Save'}</button>
                                <button type="button" className="cm-btn" onClick={() => setEditing({ id: 0, text: '' })}>Cancel</button>
                              </div>
                            </form>
                          ) : <p>{c.body}</p>}
                          {editing.id !== c.id ? (
                            <div className="ib-acts">
                              {c.mine ? <button type="button" onClick={() => { setDelAsk(''); setEditing({ id: c.id, text: c.body }); }}>Edit</button> : null}
                              {!c.mine ? <button type="button" onClick={async () => { const r = await ideaAction('reportComment', { id: c.id }); setMsg(r.error ? { err: r.error, ok: '' } : { err: '', ok: 'Thanks. The comment was reported.' }); }}>Report</button> : null}
                              {data.admin ? <button type="button" onClick={() => adminAct('hideComment', { id: c.id, hidden: !c.hidden })}>{c.hidden ? 'Restore' : 'Hide'}</button> : null}
                              {c.mine || data.admin ? <button type="button" onClick={() => askDel(`c-${c.id}`, () => adminAct('deleteComment', { id: c.id }))}>{delAsk === `c-${c.id}` ? 'Confirm Delete' : 'Delete'}</button> : null}
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="cm-mut" style={{ fontSize: 13 }}>No comments yet. Start the conversation.</p>}
                  <form className="ib-form" onSubmit={(e) => { e.preventDefault(); sendComment(i); }}>
                    <textarea className="cm-in" rows={2} maxLength={500} value={drafts[i.id] || ''} aria-label={`Comment on ${i.title}`}
                      placeholder={i.mine ? 'Reply to the comments on your idea' : 'Add a comment'}
                      onChange={(e) => { const v = e.target.value; setDrafts((d) => ({ ...d, [i.id]: v })); }} />
                    <button type="submit" className="cm-btn dk" disabled={!(drafts[i.id] || '').trim() || posting === i.id}>{posting === i.id ? 'Posting…' : 'Post Comment'}</button>
                  </form>
                  {needName ? <span className="cm-mut" style={{ fontSize: 12 }}>Posting as {nm || 'a new name'}</span> : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : <div className="cm-card"><div className="cm-cb"><p className="cm-mut">{all.length ? 'No ideas match those filters.' : 'No ideas yet. Be the first to pitch one.'}</p></div></div>}
    </CommunityShell>
    </>
  );
}

const IB_CSS = `
.ib-thread{border-top:1px solid var(--stg-ink);padding:14px 16px 16px;display:flex;flex-direction:column;gap:12px;background:var(--stg-surf2);}
.ib-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;}
.ib-c{padding:10px 0;display:flex;flex-direction:column;gap:4px;}
.ib-c + .ib-c{border-top:1px solid var(--stg-ink);}
.ib-c.fresh{box-shadow:inset 3px 0 0 var(--stg-ink);padding-left:12px;}
.ib-meta{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;font-size:13px;line-height:1.4;}
.ib-meta b{font-weight:800;}
.ib-meta span{color:var(--stg-ink2);font-weight:600;font-size:12.5px;}
.ib-c p{margin:0;font-size:14.5px;font-weight:600;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--stg-ink);}
.ib-acts{display:flex;gap:12px;}
.ib-acts button{border:0;background:none;padding:2px 0;font:inherit;font-size:12px;font-weight:800;color:var(--stg-ink2);cursor:pointer;line-height:1.4;}
.ib-acts button:hover{color:var(--stg-ink);text-decoration:underline;}
.ib-form{display:flex;gap:10px;align-items:flex-end;}
.ib-form textarea{flex:1;background:var(--stg-raise);}
@media (max-width:640px){ .ib-form{flex-direction:column;align-items:stretch;} .ib-thread{padding:12px 14px 14px;} }
`;
