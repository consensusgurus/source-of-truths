'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, ChevronDown } from 'lucide-react';
import { TYPES } from '@/lib/data';
import { postList } from '@/lib/api';
import SiteHeader from '../SiteHeader';
import Footer from '../Footer';
import { T } from '@/lib/theme';

// Standard site theme (matches the homepage, list pages, and Stat Hub):
// Manrope, light-gray canvas, white cards, blue accent.
const C = {
  bg: T.white, surface: T.white, ink: T.ink, muted: T.muted,
  soft: T.muted, line: 'rgba(20,22,28,0.30)', accent: T.accent,
  accsoft: '#e8effb', danger: T.danger,
};
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

function RequestView({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('other');
  const [blurb, setBlurb] = useState('');
  const [criteria, setCriteria] = useState('');
  const [items, setItems] = useState(Array(10).fill(''));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateItem(idx, val) {
    const next = [...items];
    next[idx] = val;
    setItems(next);
  }
  function addSlot() { if (items.length >= 30) return; setItems([...items, '']); }
  function removeSlot(idx) { if (items.length <= 3) return; setItems(items.filter((_, i) => i !== idx)); }

  function handleSubmit() {
    setError('');
    if (!title.trim()) return setError('Add a headline for your list or quiz');
    const cleanItems = items.map((i) => i.trim()).filter(Boolean).map((i) => i.slice(0, 90));
    const newList = {
      id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim().slice(0, 90),
      category: category.trim().slice(0, 40) || 'Reader Pick',
      type,
      linkType: 'search',
      blurb: blurb.trim().slice(0, 220) || 'A reader-submitted list.',
      isUserSubmitted: true,
      submittedAt: Date.now(),
      submitterName: name.trim().slice(0, 80),
      submitterEmail: email.trim().slice(0, 120),
      defaultSource: 'ai',
      sources: { ai: { label: criteria.trim() ? `As Submitted: ${criteria.trim().slice(0, 100)}` : 'As Submitted', items: cleanItems } },
      vote: { items: cleanItems },
    };
    setSubmitting(true);
    onSubmit(newList);
  }

  const filledCount = items.filter((i) => i.trim()).length;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
    .req{font-family:${FONT};color:${C.ink};}
    .req .lbl{display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${C.muted};margin-bottom:6px;}
    .req .fld{width:100%;background:var(--white);border:1px solid ${C.line};border-radius:10px;padding:11px 13px;font-family:${FONT};font-size:15px;color:${C.ink};outline:none;box-sizing:border-box;}
    .req .fld:focus{border-color:${C.accent};box-shadow:0 0 0 3px ${C.accsoft};}
    .req textarea.fld{resize:vertical;min-height:60px;}
    .req select.fld{appearance:none;-webkit-appearance:none;cursor:pointer;padding-right:34px;}
    .req .card{background:${C.surface};border:1px solid ${C.line};border-radius:14px;padding:20px;}
    .req .pick{display:flex;align-items:center;gap:12px;background:${C.bg};border:1px solid ${C.line};border-radius:10px;padding:8px 12px;}
    .req .pickno{min-width:26px;font-weight:800;font-size:15px;font-variant-numeric:tabular-nums;}
    .req .pickin{flex:1;min-width:0;background:transparent;border:none;outline:none;font-family:${FONT};font-size:15px;color:${C.ink};padding:4px 0;}
    .req .iconbtn{background:transparent;border:none;color:${C.soft};cursor:pointer;display:flex;align-items:center;padding:4px;}
    .req .iconbtn:hover{color:${C.danger};}
    .req .addbtn{margin-top:12px;width:100%;display:flex;align-items:center;justify-content:center;gap:7px;background:var(--white);color:${C.ink};border:1px dashed ${C.line};border-radius:10px;padding:11px 16px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;cursor:pointer;}
    .req .addbtn:hover{border-color:${C.accent};color:${C.accent};}
    .req .submit{width:100%;background:${C.accent};color:var(--white);border:none;border-radius:10px;padding:14px 24px;font-family:${FONT};font-size:14px;font-weight:700;cursor:pointer;}
    .req .submit:hover{filter:brightness(1.05);}
    .req .submit:disabled{opacity:.6;cursor:wait;}
    .req .back{display:inline-flex;align-items:center;gap:6px;color:${C.muted};text-decoration:none;font-size:13px;font-weight:600;margin:14px 0 4px;}
    .req .back:hover{color:${C.ink};}
    .req .reqgrid{display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:start;}
    .req .col{display:flex;flex-direction:column;gap:22px;}
    @media(max-width:820px){.req .reqgrid{grid-template-columns:1fr !important;}}
    @media(max-width:560px){.req .two{grid-template-columns:1fr !important;}}
  `;

  return (
    <div className="req" style={{ maxWidth: 1180, margin: '0 auto', padding: '12px 24px 80px' }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div style={{ borderBottom: `1px solid ${C.line}`, paddingBottom: 22, marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.accent, marginBottom: 12 }}>Letter to the Editor</div>
        <h1 style={{ fontSize: 'clamp(30px, 6vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05, margin: 0 }}>Request a list or quiz</h1>
        <p style={{ fontSize: 16, lineHeight: 1.5, margin: '14px 0 0', color: C.muted, maxWidth: 620 }}>
          Only a headline is required. Add as much or as little as you want, and an editor will handle the rest.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 22, padding: 13, border: `1px solid ${C.danger}`, background: 'rgba(192,57,43,0.07)', borderRadius: 10, fontSize: 14, color: C.danger, display: 'flex', alignItems: 'center', gap: 8 }}>
          <X size={14} strokeWidth={2.5} /> {error}
        </div>
      )}

      <div className="reqgrid">
        <div className="col">
          <div>
            <label className="lbl">Headline (required)</label>
            <input className="fld" type="text" placeholder="Best beaches in Sicily; Name the 50 US state capitals" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90} />
          </div>

          <div className="two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <label className="lbl">Tag (optional)</label>
              <input className="fld" type="text" placeholder="Sicily, Travel, anything" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={40} />
            </div>
            <div style={{ position: 'relative' }}>
              <label className="lbl">Type (optional)</label>
              <select className="fld" value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.filter((t) => t.id !== 'all').map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
              </select>
              <ChevronDown size={15} strokeWidth={2.4} style={{ position: 'absolute', right: 12, bottom: 13, pointerEvents: 'none', color: C.muted }} />
            </div>
          </div>

          <div>
            <label className="lbl">One-line description (optional)</label>
            <textarea className="fld" placeholder="A quick pitch for your readers" value={blurb} onChange={(e) => setBlurb(e.target.value)} maxLength={220} rows={2} />
          </div>

          <div>
            <label className="lbl">How you ranked them (optional)</label>
            <input className="fld" type="text" placeholder="By reputation, sand quality…" value={criteria} onChange={(e) => setCriteria(e.target.value)} maxLength={140} />
          </div>

          <div>
            <button className="submit" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Sending…' : 'Submit request'}</button>
            <div className="two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
              <div>
                <label className="lbl">Name (optional)</label>
                <input className="fld" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              </div>
              <div>
                <label className="lbl">Email (optional)</label>
                <input className="fld" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
              </div>
            </div>
            <p style={{ fontSize: 11, letterSpacing: '.04em', textTransform: 'uppercase', color: C.soft, fontWeight: 700, marginTop: 14 }}>Submissions are reviewed before going live</p>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em', margin: 0 }}>Your picks, in order (optional)</h3>
            <span style={{ fontSize: 11, letterSpacing: '.04em', textTransform: 'uppercase', color: C.soft, fontWeight: 700 }}>{filledCount} filled · #1 at top</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((val, i) => (
              <div key={i} className="pick">
                <span className="pickno" style={{ color: i === 0 ? C.accent : C.soft }}>{String(i + 1).padStart(2, '0')}</span>
                <input className="pickin" type="text" value={val} onChange={(e) => updateItem(i, e.target.value)} placeholder={`Pick number ${i + 1} (optional)`} maxLength={90} />
                {items.length > 3 && (
                  <button className="iconbtn" onClick={() => removeSlot(i)} aria-label="Remove slot"><X size={14} strokeWidth={2.5} /></button>
                )}
              </div>
            ))}
          </div>
          {items.length < 30 && (
            <button className="addbtn" onClick={addSlot}><Plus size={13} strokeWidth={3} /> Add another slot</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RequestClient() {
  const router = useRouter();
  async function handleSubmit(newList) {
    const result = await postList(newList);
    if (result && result.ok) router.push('/request/thanks');
    else alert('Could not save your request. Please try again.');
  }
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: FONT }}>
      <SiteHeader active="lists" />
      <RequestView onSubmit={handleSubmit} />
      <Footer />
    </div>
  );
}
