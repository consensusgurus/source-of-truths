'use client';

// REACH-OUT FORMS (owner, 2026-11-08). "Submit or List a Puzzle" and "Sponsor a
// Day" sit at the foot of the home's left navigation. Each is a short form that
// posts to /api/complaints, the same table the list complaints use, so every
// entry lands in the admin Feedback tab under Notices with the sender's name
// and a mailto link to reply from admin@mindloftdaily.com. The listId is the
// page's own route and the listTitle carries a [Tag] prefix, which is how the
// admin card links back here instead of to /list/<id>.
import { useState } from 'react';
import CircuitFrame from '../circuits/CircuitFrame';
import { CSS as RUN_CSS } from '../run/RunPageClient';

export default function ReachForm({ kind }) {
  const sponsor = kind === 'sponsor';
  const title = sponsor ? 'Sponsor a Day' : 'Submit or List a Puzzle';
  const [mode, setMode] = useState('submit');
  const [f, setF] = useState({ name: '', email: '', what: '', link: '', day: '', note: '', hp: '' });
  const [state, setState] = useState('idle');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim());
  const ready = f.name.trim() && emailOk && f.what.trim() && state !== 'busy';

  const send = async (e) => {
    e.preventDefault();
    if (!ready) return;
    if (f.hp) { setState('done'); return; }
    setState('busy');
    const lines = sponsor
      ? [`Company or brand: ${f.what.trim()}`, f.day ? `Day wanted: ${f.day}` : '', f.link.trim() ? `Website: ${f.link.trim()}` : '', f.note.trim() ? `\n${f.note.trim()}` : '']
      : [`Type: ${mode === 'list' ? 'List an existing puzzle' : 'Submit a puzzle'}`, `Puzzle: ${f.what.trim()}`, f.link.trim() ? `Link: ${f.link.trim()}` : '', f.note.trim() ? `\n${f.note.trim()}` : ''];
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: sponsor ? 'sponsor-a-day' : 'submit-a-puzzle',
          listTitle: sponsor ? `[Sponsor a Day] ${f.what.trim()}` : `[Puzzle Submission] ${f.what.trim()}`,
          message: lines.filter(Boolean).join('\n').slice(0, 1000),
          name: f.name.trim(),
          email: f.email.trim(),
        }),
      });
      setState(res.ok ? 'done' : 'err');
    } catch (err) { setState('err'); }
  };

  return (
    <CircuitFrame label={title} bar={{ title, sub: 'Get in Touch' }}>
      <style dangerouslySetInnerHTML={{ __html: RUN_CSS + CSS }} />
      <div className="br">
        <div className="br-head">
          <p className="br-sub">
            {sponsor
              ? 'Put your name on a day of Mind Loft. Tell us a little about you and we will reply by email.'
              : 'Made a puzzle, or run a puzzle site you would like listed on Mind Loft? Tell us about it and we will reply by email.'}
          </p>
        </div>
        {state === 'done' ? (
          <div className="br-card br-pad rf-done">
            <h2>Thanks, we have it.</h2>
            <p>We read every note and will write back to {f.email.trim() || 'you'} soon.</p>
            <a className="br-go" href="/">Back to Puzzles</a>
          </div>
        ) : (
          <form className="br-card br-pad rf" onSubmit={send} noValidate>
            {sponsor ? null : (
              <div className="rf-seg" role="group" aria-label="What would you like to do">
                <button type="button" aria-pressed={mode === 'submit'} onClick={() => setMode('submit')}>Submit a Puzzle</button>
                <button type="button" aria-pressed={mode === 'list'} onClick={() => setMode('list')}>List My Puzzle</button>
              </div>
            )}
            <label className="rf-f"><span>Your name</span>
              <input value={f.name} onChange={set('name')} autoComplete="name" maxLength={120} required /></label>
            <label className="rf-f"><span>Email</span>
              <input type="email" value={f.email} onChange={set('email')} autoComplete="email" maxLength={200} required /></label>
            <label className="rf-f"><span>{sponsor ? 'Company or brand' : 'Puzzle name'}</span>
              <input value={f.what} onChange={set('what')} maxLength={140} required /></label>
            <label className="rf-f"><span>{sponsor ? 'Website (optional)' : 'Link (optional)'}</span>
              <input type="url" value={f.link} onChange={set('link')} placeholder="https://" maxLength={300} /></label>
            {sponsor ? (
              <label className="rf-f"><span>Day you would like (optional)</span>
                <input type="date" value={f.day} onChange={set('day')} /></label>
            ) : null}
            <label className="rf-f"><span>{sponsor ? 'Anything else (optional)' : 'Tell us about it (optional)'}</span>
              <textarea value={f.note} onChange={set('note')} rows={4} maxLength={700} /></label>
            <input className="rf-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.hp} onChange={set('hp')} />
            {state === 'err' ? <p className="rf-err" role="alert">That did not send. Try again, or email admin@mindloftdaily.com.</p> : null}
            <button type="submit" className="br-go" disabled={!ready}>{state === 'busy' ? 'Sending' : 'Send'}</button>
          </form>
        )}
      </div>
    </CircuitFrame>
  );
}

const CSS = `
.rf{display:flex;flex-direction:column;gap:14px;}
.rf-f{display:flex;flex-direction:column;gap:6px;}
.rf-f > span{font-size:12px;font-weight:700;color:var(--stg-mute);}
.rf-f input,.rf-f textarea{box-sizing:border-box;width:100%;border:1px solid var(--stg-ink);border-radius:12px;background:var(--stg-surf);
  padding:0 14px;font-family:inherit;font-size:16px;font-weight:600;color:var(--stg-ink);}
.rf-f input{height:46px;}
.rf-f textarea{padding:12px 14px;resize:vertical;min-height:96px;line-height:1.4;}
.rf-f input:focus,.rf-f textarea:focus{outline:2px solid var(--stg-ink);outline-offset:1px;}
.rf-seg{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--stg-ink);border-radius:12px;overflow:hidden;}
.rf-seg button{height:42px;border:0;background:transparent;color:var(--stg-ink);font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;}
.rf-seg button + button{border-left:1px solid var(--stg-ink);}
.rf-seg button[aria-pressed="true"]{background:var(--stg-ink);color:var(--stg-ground);}
.rf-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;}
.rf-err{margin:0;font-size:13px;font-weight:700;color:var(--stg-ink);}
.rf .br-go:disabled{background:var(--stg-surf2);color:var(--stg-mute);cursor:default;filter:none;}
.rf-done{display:flex;flex-direction:column;gap:10px;text-align:center;}
.rf-done h2{margin:0;font-size:20px;font-weight:800;color:var(--stg-ink);}
.rf-done p{margin:0 0 6px;font-size:14px;font-weight:600;color:var(--stg-mute);}
.rf-done .br-go{text-decoration:none;}
`;
