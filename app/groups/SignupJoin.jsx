'use client';
// SIGN UP AND JOIN, IN ONE STEP (owner, 2026-09-17). A reader with no account
// picks a name (pre-filled), optionally adds an email, and the same press makes
// the account and does whatever the page asked for (join this group, open the
// groups list). A returning player on a new device uses the "already signed up"
// side: /api/quiz/join signs a name-only account in on the name alone and an
// email account in on name plus email, so both sides are the same request.
//
// The name-taken and locked-out cases reuse the site's own help, SigninHelp and
// EmailLockNote, so this form says exactly what the other six join forms say.
import React, { useState } from 'react';
import SigninHelp, { isLockedOut, EmailLockNote } from '../SigninHelp';
import { ensureAccount } from './GroupsShell';

export default function SignupJoin({ initialName = '', cta = 'Sign up and join', busyCta = 'Joining…', onDone, precheck, compact = false }) {
  const [mode, setMode] = useState('new');
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  // Only an ACCOUNT error earns the sign-in help; a page error (no group name) does not.
  const [acctErr, setAcctErr] = useState(false);
  // The pre-filled name arrives from an effect in the parent, after first paint.
  const [seeded, setSeeded] = useState(!!initialName);
  if (!seeded && initialName) { setSeeded(true); setName(initialName); }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    // A page-level check (a group name, say) runs before any account is made.
    const pre = precheck ? precheck() : '';
    if (pre) { setErr(pre); setAcctErr(false); return; }
    setBusy(true);
    setErr('');
    setAcctErr(false);
    const acct = await ensureAccount(name, email);
    if (acct.error) { setErr(acct.error); setAcctErr(true); setBusy(false); return; }
    const res = onDone ? await onDone(acct) : null;
    if (res && res.error) setErr(res.error);
    setBusy(false);
  }

  const back = mode === 'back';
  return (
    <form className={`sj${compact ? ' sj-compact' : ''}`} onSubmit={submit}>
      <div className="sj-tabs" role="tablist" aria-label="Account">
        <button type="button" role="tab" aria-selected={!back} className="sj-tab"
          onClick={() => { setMode('new'); setErr(''); }}>New here</button>
        <button type="button" role="tab" aria-selected={back} className="sj-tab"
          onClick={() => { setMode('back'); setErr(''); if (name === initialName) setName(''); }}>Already signed up</button>
      </div>
      <div className="sj-fields">
        <label className="sj-field">
          <span className="grp-lbl">{back ? 'Your display name' : 'Your name on the board'}</span>
          <input className="grp-in" maxLength={15} value={name} autoComplete="nickname"
            placeholder={back ? 'The name you play under' : ''}
            onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="sj-field">
          <span className="grp-lbl">{back ? 'Email, if you gave one' : 'Email (optional)'}</span>
          <input className="grp-in" type="email" value={email} autoComplete="email" inputMode="email"
            placeholder={back ? 'The one you signed up with' : 'Keeps your spot on any device'}
            onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button className="grp-btn solid sj-go" type="submit" disabled={busy}>
          {busy ? busyCta : back ? cta.replace(/^Sign up/, 'Sign in') : cta}
        </button>
      </div>
      {back ? (
        <p className="grp-note grp-mute sj-small">Signing in here moves your stats and history onto this device too.</p>
      ) : (
        <div className="sj-small"><EmailLockNote email={email} style={{ margin: 0 }} /></div>
      )}
      {err ? <p className="grp-err">{err}</p> : null}
      {err && acctErr ? <SigninHelp name={name} email={email} prominent={isLockedOut(err)} /> : null}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </form>
  );
}

const CSS = `
.sj{display:flex;flex-direction:column;gap:10px;width:100%;}
.sj-tabs{display:flex;gap:4px;}
.sj-tab{border:1px solid var(--stg-line2);background:none;color:var(--stg-ink2);border-radius:999px;padding:5px 12px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;}
.sj-tab[aria-selected=true]{background:var(--stg-ink);border-color:var(--stg-ink);color:var(--stg-ground);}
.sj-tab:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.sj-fields{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr) auto;gap:8px;align-items:end;}
.sj-field{display:flex;flex-direction:column;gap:5px;min-width:0;}
.sj-go{height:40px;}
.sj-small{font-size:12px;}
.sj-compact .sj-fields{grid-template-columns:minmax(0,1fr);}
.sj-compact .sj-go{justify-self:start;}
@media(max-width:640px){
  .sj-fields{grid-template-columns:minmax(0,1fr);}
  .sj-go{justify-self:stretch;}
}
`;
