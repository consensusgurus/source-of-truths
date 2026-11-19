'use client';
// PUZZLE PEERS, /community/peers (first called Puzzle Friends; owner, 2026-11-18: "That should be coming
// soon and also a submit / request form"). The list of other puzzle makers is
// not published yet. What works today is the form: a maker sends their site
// to be listed, or a player requests a site they love. It posts to
// /api/complaints like the other reach-out forms (app/reach/ReachForm.jsx), so
// each entry lands in the admin Feedback tab under Notices with a reply link,
// tagged [Puzzle Peers].
import React, { useState } from 'react';
import Link from 'next/link';
import CommunityShell from './CommunityShell';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PeersClient() {
  const [mode, setMode] = useState('list');
  const [f, setF] = useState({ name: '', email: '', site: '', link: '', note: '', hp: '' });
  const [state, setState] = useState('idle');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const ready = f.name.trim() && EMAIL_RE.test(f.email.trim()) && f.site.trim() && state !== 'busy';
  const send = async (e) => {
    e.preventDefault();
    if (!ready) return;
    if (f.hp) { setState('done'); return; }
    setState('busy');
    const lines = [
      `Type: ${mode === 'list' ? 'List my site' : 'Request a site'}`,
      `Site: ${f.site.trim()}`,
      f.link.trim() ? `Link: ${f.link.trim()}` : '',
      f.note.trim() ? `\n${f.note.trim()}` : '',
    ];
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: 'community/peers',
          listTitle: `[Puzzle Peers] ${mode === 'list' ? 'List' : 'Request'}: ${f.site.trim()}`.slice(0, 200),
          message: lines.filter(Boolean).join('\n').slice(0, 1000),
          name: f.name.trim(),
          email: f.email.trim(),
        }),
      });
      setState(res.ok ? 'done' : 'err');
    } catch (err) { setState('err'); }
  };

  return (
    <CommunityShell tab="peers" title="Puzzle Peers"
      sub="Other puzzle makers and sites we like, gathered in one place. The list is coming soon. Make puzzles, or know a site that belongs here? Send it in."
      aside={<span className="cm-chip dk" style={{ fontSize: 13, padding: '6px 14px' }}>Coming Soon</span>}>
      <div className="cm-g32">
        <section className="cm-card">
          <div className="cm-ch"><b>{mode === 'list' ? 'List My Site' : 'Request A Site'}</b><span>We reply by email</span></div>
          {state === 'done' ? (
            <div className="cm-cb">
              <b style={{ fontSize: 18, fontWeight: 800 }}>Thanks, we have it.</b>
              <p className="cm-mut">We read every note and will write back to {f.email.trim() || 'you'} soon.</p>
              <div><button type="button" className="cm-btn" onClick={() => { setF({ name: f.name, email: f.email, site: '', link: '', note: '', hp: '' }); setState('idle'); }}>Send Another</button></div>
            </div>
          ) : (
            <form className="cm-cb" onSubmit={send} noValidate>
              <div className="cm-seg" role="group" aria-label="What would you like to do">
                <button type="button" className={mode === 'list' ? 'on' : ''} aria-pressed={mode === 'list'} onClick={() => setMode('list')}>List My Site</button>
                <button type="button" className={mode === 'request' ? 'on' : ''} aria-pressed={mode === 'request'} onClick={() => setMode('request')}>Request A Site</button>
              </div>
              <p className="cm-mut">{mode === 'list'
                ? 'You make puzzles or run a puzzle site. Tell us about it and we will look at featuring it here.'
                : 'You play a puzzle site you think other Mind Loft players would love. Tell us which one.'}</p>
              <label className="cm-lab">Your name
                <input className="cm-in" value={f.name} onChange={set('name')} autoComplete="name" maxLength={120} required /></label>
              <label className="cm-lab">Email
                <input className="cm-in" type="email" value={f.email} onChange={set('email')} autoComplete="email" maxLength={200} required /></label>
              <label className="cm-lab">{mode === 'list' ? 'Your site or puzzle' : 'The site'}
                <input className="cm-in" value={f.site} onChange={set('site')} maxLength={140} required /></label>
              <label className="cm-lab">Link (optional)
                <input className="cm-in" type="url" value={f.link} onChange={set('link')} placeholder="https://" maxLength={300} /></label>
              <label className="cm-lab">{mode === 'list' ? 'Tell us about it (optional)' : 'Why it belongs here (optional)'}
                <textarea className="cm-in" value={f.note} onChange={set('note')} rows={4} maxLength={700} /></label>
              <input value={f.hp} onChange={set('hp')} tabIndex={-1} autoComplete="off" aria-hidden="true"
                style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
              {state === 'err' ? <p className="cm-err" role="alert">That did not send. Try again, or email m@mindloftdaily.com.</p> : null}
              <div><button type="submit" className="cm-btn dk" disabled={!ready}>{state === 'busy' ? 'Sending…' : 'Send'}</button></div>
            </form>
          )}
        </section>
        {/* On a phone the Coming Soon note leads, then the form (owner, 2026-11-18). */}
        <div className="cm-col cm-first">
          <section className="cm-card">
            <div className="cm-ch" style={{ background: 'var(--cm-violet)' }}><b>Coming Soon</b></div>
            <div className="cm-cb">
              <p className="cm-mut">A hand-picked list of puzzle makers and sites, by kind: words and dailies, trivia, logic and sudoku, maps and chess.</p>
              <p className="cm-mut">Sites sent in through this form are the first we look at.</p>
            </div>
          </section>
          <section className="cm-card">
            <div className="cm-ch"><b>Have An Idea Instead?</b></div>
            <div className="cm-cb">
              <p className="cm-mut">Ideas for a new puzzle or a change to Mind Loft go on the Idea Board, where other players can vote on them.</p>
              <div><Link className="cm-btn pri" href="/community/ideas?pitch=puzzle">Pitch An Idea</Link></div>
            </div>
          </section>
        </div>
      </div>
    </CommunityShell>
  );
}
