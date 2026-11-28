'use client';

import { useState } from 'react';
import { PHOTO_TOPICS, imgSrc, offerLabel } from '@/lib/photo-puzzle-shared';
import { sizeLabel } from '@/lib/jigsaw-sizes';

const TABS = [['pending', 'Waiting'], ['offered', 'Offered for Dailies'], ['approved', 'Approved'], ['private', 'Private Links'], ['declined', 'Turned Down'], ['off', 'Turned Off']];
const when = (iso) => { try { return new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } };

export default function ReviewClient({ items: given }) {
  const [items, setItems] = useState(given);
  const [tab, setTab] = useState('pending');
  const [edit, setEdit] = useState({});          // code -> { name, topic }
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  async function act(m, op) {
    if (op === 'off' && !window.confirm(`Turn off "${m.name}"? The photo is deleted and its link stops working.`)) return;
    setBusy(m.code + op); setErr('');
    const e = edit[m.code] || {};
    try {
      const r = await fetch('/api/photo-puzzles', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'admin', op, code: m.code, name: e.name || m.name, topic: e.topic || m.topic || 'other' }),
      }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error || 'failed');
      setItems((a) => a.map((x) => (x.code === m.code ? { ...x, ...r.meta } : x)));
    } catch (x) { setErr(`${m.name}: ${x.message}`); }
    setBusy('');
  }

  const inTab = (m, k) => (k === 'offered' ? (m.offer || []).length > 0 && m.status !== 'off' : m.status === k);
  const shown = items.filter((m) => inTab(m, tab));
  const count = (k) => items.filter((m) => inTab(m, k)).length;
  const field = { background: '#16120e', border: '1px solid rgba(244,234,216,.3)', borderRadius: 8, color: '#f4ead8', fontSize: 14, padding: '8px 10px', fontFamily: 'inherit' };

  return (
    <>
      <p>New submissions also email m@mindloftdaily.com the moment they are made.</p>
      <div className="pz-sizes" role="tablist" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
        {TABS.map(([k, l]) => <a key={k} href="#" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={(e) => { e.preventDefault(); setTab(k); }}>{l}<small>{count(k)}</small></a>)}
      </div>
      {err ? <p role="alert" style={{ color: '#ffb4a8' }}>{err}</p> : null}
      {!shown.length ? <p style={{ marginTop: 18 }}>Nothing here.</p> : null}
      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {shown.map((m) => {
          const e = edit[m.code] || {};
          const set = (k, v) => setEdit((o) => ({ ...o, [m.code]: { ...(o[m.code] || {}), [k]: v } }));
          return (
            <li key={m.code} className="pz-card" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <a href={`/jigsaw/p/${m.code}`} target="_blank" rel="noopener noreferrer" style={{ flex: 'none' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.status !== 'off' ? <img src={`${imgSrc(m.code)}&w=500`} alt={m.name} style={{ width: 180, height: 135, objectFit: 'cover', borderRadius: 8, display: 'block' }} /> : <span style={{ display: 'block', width: 180, height: 135, borderRadius: 8, background: '#16120e' }} />}
              </a>
              <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <b style={{ fontSize: 17 }}>{m.name}</b>
                <span className="pz-note">By {m.by || 'not given'} · {when(m.at)} · {m.w} x {m.h} · up to {sizeLabel(m.max)} pieces</span>
                {(m.offer || []).length ? <span className="pz-note" style={{ color: '#f3d98b', fontWeight: 700 }}>Offered for {m.offer.map(offerLabel).join(', ')}</span> : null}
                {(m.offer || []).length && m.credit ? <span className="pz-note">Credit: {m.credit.name || m.by || 'not given'}{m.credit.title ? `, \u201c${m.credit.title}\u201d` : ''}{m.credit.url ? <> &middot; <a href={m.credit.url} target="_blank" rel="noopener noreferrer">{m.credit.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></> : null}</span> : null}
                {m.slug ? <a href={`/jigsaw/community/${m.slug}`} className="pz-note" target="_blank" rel="noopener noreferrer">/jigsaw/community/{m.slug}</a> : null}
                {m.status === 'pending' || m.status === 'approved' ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input aria-label="Title" style={{ ...field, flex: '1 1 200px' }} value={e.name ?? m.name} onChange={(x) => set('name', x.target.value)} />
                    <select aria-label="Topic" style={field} value={e.topic || m.topic || 'other'} onChange={(x) => set('topic', x.target.value)}>
                      {PHOTO_TOPICS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </div>
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {m.status === 'pending' ? <button type="button" className="pz-btn" disabled={!!busy} onClick={() => act(m, 'approve')}>Approve</button> : null}
                {m.status === 'approved' ? <button type="button" className="pz-btn" disabled={!!busy} onClick={() => act(m, 'retitle')}>Save Title</button> : null}
                {m.status === 'pending' ? <button type="button" className="pz-btn ghost" disabled={!!busy} onClick={() => act(m, 'decline')}>Turn Down</button> : null}
                {m.status === 'approved' ? <button type="button" className="pz-btn ghost" disabled={!!busy} onClick={() => act(m, 'unlist')}>Take Off Community</button> : null}
                {m.status === 'declined' || (m.status === 'private' && m.submitted) ? <button type="button" className="pz-btn ghost" disabled={!!busy} onClick={() => act(m, 'approve')}>Approve Anyway</button> : null}
                {m.status !== 'off' ? <button type="button" className="pz-btn ghost" disabled={!!busy} onClick={() => act(m, 'off')} style={{ color: '#ffb4a8', borderColor: '#ffb4a8' }}>Turn Off Link</button> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
