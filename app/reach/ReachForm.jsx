'use client';

// REACH-OUT FORMS (owner, 2026-11-08). "Submit or List a Puzzle" and "Sponsor a
// Day" sit at the foot of the home's left navigation. Each is a short form that
// posts to /api/complaints, the same table the list complaints use, so every
// entry lands in the admin Feedback tab under Notices with the sender's name
// and a mailto link to reply from admin@mindloftdaily.com. The listId is the
// page's own route and the listTitle carries a [Tag] prefix, which is how the
// admin card links back here instead of to /list/<id>.
import { useMemo, useState } from 'react';
import CircuitFrame from '../circuits/CircuitFrame';
import { CSS as RUN_CSS } from '../run/RunPageClient';


// THE SPONSOR CALENDAR (owner, 2026-11-08). A day costs $100 on a weekday and
// $60 on Saturday or Sunday. Days open from tomorrow (Eastern) through three
// months out; the reader taps any number of days and the total adds up below.
// Nothing is charged here: the picked days ride along with the request and
// we follow up by email.
const PRICE_WD = 100;
const PRICE_WE = 60;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const priceOf = (iso) => { const w = new Date(iso + 'T12:00:00Z').getUTCDay(); return w === 0 || w === 6 ? PRICE_WE : PRICE_WD; };
const nice = (iso) => { const t = new Date(iso + 'T12:00:00Z'); return `${DOW[t.getUTCDay()]} ${MONTHS[t.getUTCMonth()].slice(0, 3)} ${t.getUTCDate()}`; };
function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function addDays(iso, n) { const t = new Date(iso + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
function addMonths(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0, 12)).getUTCDate();
  return ymd(t.getUTCFullYear(), t.getUTCMonth(), Math.min(d, last));
}

function SponsorCalendar({ picked, onToggle }) {
  const today = useMemo(() => etToday(), []);
  const first = addDays(today, 1);
  const last = addMonths(today, 3);
  const [fy, fm] = first.split('-').map(Number);
  const [ly, lm] = last.split('-').map(Number);
  const span = (ly - fy) * 12 + (lm - fm);
  const [off, setOff] = useState(0);
  const y = fy + Math.floor((fm - 1 + off) / 12);
  const m = (fm - 1 + off) % 12;
  const lead = new Date(Date.UTC(y, m, 1, 12)).getUTCDay();
  const days = new Date(Date.UTC(y, m + 1, 0, 12)).getUTCDate();
  const cells = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= days; d += 1) cells.push(ymd(y, m, d));
  return (
    <div className="sc">
      <div className="sc-head">
        <button type="button" className="sc-nav" onClick={() => setOff((o) => Math.max(0, o - 1))} disabled={off === 0} aria-label="Previous month">&larr;</button>
        <b>{MONTHS[m]} {y}</b>
        <button type="button" className="sc-nav" onClick={() => setOff((o) => Math.min(span, o + 1))} disabled={off >= span} aria-label="Next month">&rarr;</button>
      </div>
      <div className="sc-grid" role="group" aria-label={`${MONTHS[m]} ${y}`}>
        {DOW.map((w) => <span key={w} className="sc-dow">{w.slice(0, 1)}</span>)}
        {cells.map((iso, i) => {
          if (!iso) return <span key={'x' + i} />;
          const open = iso >= first && iso <= last;
          const on = picked.includes(iso);
          const d = Number(iso.slice(8));
          return (
            <button key={iso} type="button" className={'sc-d' + (on ? ' on' : '') + (priceOf(iso) === PRICE_WE ? ' we' : '')}
              disabled={!open} aria-pressed={on} aria-label={`${nice(iso)}, $${priceOf(iso)}`} onClick={() => onToggle(iso)}>
              <b>{d}</b>{open ? <small>${priceOf(iso)}</small> : null}
            </button>
          );
        })}
      </div>
      <p className="sc-key">Weekdays ${PRICE_WD} &middot; Weekends ${PRICE_WE}</p>
    </div>
  );
}

export default function ReachForm({ kind }) {
  const sponsor = kind === 'sponsor';
  const title = sponsor ? 'Sponsor a Day' : 'Submit or List a Puzzle';
  const [mode, setMode] = useState('submit');
  const [f, setF] = useState({ name: '', email: '', what: '', link: '', note: '', hp: '' });
  const [days, setDays] = useState([]);
  const toggleDay = (iso) => setDays((p) => (p.includes(iso) ? p.filter((x) => x !== iso) : [...p, iso].sort()));
  const total = days.reduce((t, iso) => t + priceOf(iso), 0);
  const [state, setState] = useState('idle');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim());
  const ready = f.name.trim() && emailOk && f.what.trim() && (!sponsor || days.length > 0) && state !== 'busy';

  const send = async (e) => {
    e.preventDefault();
    if (!ready) return;
    if (f.hp) { setState('done'); return; }
    setState('busy');
    const lines = sponsor
      ? [`Company or brand: ${f.what.trim()}`, `Days (${days.length}, $${total}): ${days.map((iso) => `${iso} $${priceOf(iso)}`).join(', ')}`, f.link.trim() ? `Website: ${f.link.trim()}` : '', f.note.trim() ? `\n${f.note.trim()}` : '']
      : [`Type: ${mode === 'list' ? 'List an existing puzzle' : 'Submit a puzzle'}`, `Puzzle: ${f.what.trim()}`, f.link.trim() ? `Link: ${f.link.trim()}` : '', f.note.trim() ? `\n${f.note.trim()}` : ''];
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: sponsor ? 'sponsor-a-day' : 'submit-a-puzzle',
          listTitle: sponsor ? `[Sponsor a Day] ${f.what.trim()} (${days.length} day${days.length === 1 ? '' : 's'}, $${total})` : `[Puzzle Submission] ${f.what.trim()}`,
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
              ? 'Put your name on a day of Mind Loft. Pick your days, tell us a little about you and we will reply by email to confirm.'
              : 'Made a puzzle, or run a puzzle site you would like listed on Mind Loft? Tell us about it and we will reply by email.'}
          </p>
        </div>
        {state === 'done' ? (
          <div className="br-card br-pad rf-done">
            <h2>Thanks, we have it.</h2>
            <p>{sponsor ? `${days.length} day${days.length === 1 ? '' : 's'} requested, $${total} total. ` : ''}We read every note and will write back to {f.email.trim() || 'you'} soon.</p>
            <a className="br-go" href="/">Back to Puzzles</a>
          </div>
        ) : (
          <form className="br-card br-pad rf" onSubmit={send} noValidate>
            {sponsor ? (
              <div className="rf-f"><span>Pick your days</span>
                <SponsorCalendar picked={days} onToggle={toggleDay} />
                <div className="sc-sum" aria-live="polite">
                  {days.length ? (
                    <><span>{days.map(nice).join(', ')}</span><b>{days.length} day{days.length === 1 ? '' : 's'} &middot; ${total}</b></>
                  ) : <span>No days picked yet</span>}
                </div>
              </div>
            ) : null}
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
            <label className="rf-f"><span>{sponsor ? 'Anything else (optional)' : 'Tell us about it (optional)'}</span>
              <textarea value={f.note} onChange={set('note')} rows={4} maxLength={700} /></label>
            <input className="rf-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.hp} onChange={set('hp')} />
            {state === 'err' ? <p className="rf-err" role="alert">That did not send. Try again, or email admin@mindloftdaily.com.</p> : null}
            <button type="submit" className="br-go" disabled={!ready}>{state === 'busy' ? 'Sending' : sponsor && days.length ? `Request ${days.length} Day${days.length === 1 ? '' : 's'} \u00b7 $${total}` : 'Send'}</button>
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
.sc{border:1px solid var(--stg-ink);border-radius:12px;overflow:hidden;background:var(--stg-surf);}
.sc-head{display:flex;align-items:center;justify-content:space-between;padding:6px;border-bottom:1px solid var(--stg-ink);}
.sc-head b{font-size:15px;font-weight:800;color:var(--stg-ink);}
.sc-nav{width:40px;height:36px;border:0;border-radius:8px;background:transparent;color:var(--stg-ink);font-family:inherit;font-size:18px;font-weight:800;cursor:pointer;}
.sc-nav:hover:not(:disabled){background:var(--stg-surf2);}
.sc-nav:disabled{opacity:.25;cursor:default;}
.sc-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;padding:8px;}
.sc-dow{text-align:center;font-size:11px;font-weight:800;color:var(--stg-mute);padding:2px 0 4px;}
.sc-d{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:50px;border:1px solid var(--stg-line);border-radius:8px;
  background:transparent;color:var(--stg-ink);font-family:inherit;cursor:pointer;padding:0;}
.sc-d b{font-size:15px;font-weight:800;line-height:1;}
.sc-d small{font-size:11px;font-weight:700;color:var(--stg-mute);}
.sc-d:hover:not(:disabled){border-color:var(--stg-ink);}
.sc-d.on{background:var(--stg-ink);border-color:var(--stg-ink);color:var(--stg-ground);}
.sc-d.on small{color:var(--stg-ground);}
.sc-d:disabled{border-color:transparent;opacity:.3;cursor:default;}
.sc-key{margin:0;padding:8px 12px;border-top:1px solid var(--stg-line);font-size:12px;font-weight:700;color:var(--stg-mute);text-align:center;}
.sc-sum{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:13px;font-weight:600;color:var(--stg-mute);}
.sc-sum b{flex:none;font-size:14px;font-weight:800;color:var(--stg-ink);}

`;
