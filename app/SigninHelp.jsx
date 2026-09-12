'use client';

// SigninHelp — "Trouble signing back in? Report an issue", for every join surface.
//
// WHY THIS EXISTS. The domain move left registered players signed out: the identity
// cache (sot_quiz_identity) is localStorage, which is per-origin and does not travel.
// The anon id DOES travel, via the ?_ml handoff, but adoptable() refuses it when the
// browser already has an id older than 10s — true for anyone who visited the new
// domain during the soft launch. Those players hit `username_taken`, whose advice is
// "add the email you signed up with". An account created with a display name only has
// no such email, so that is a dead end with no self-service way out.
//
// Reconnecting a name-only account without proof would be account takeover, so the
// correct fix is a human. This routes them to one, carrying the details that make the
// report actionable rather than "it does not work".
//
// ONE component, used by all six join surfaces (JoinLeaderboardForm plus the five
// "Claim your name" modals). They were five near-identical copies of the same form;
// putting the help in one place is what stops it being added to only some of them.

import React, { useState } from 'react';
import { T } from '@/lib/theme';

const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
// Same custom-property ink as JoinLeaderboardForm, for the same reason: this
// renders straight onto the page ground, and on a navy Loft page the prominent
// link was var(--accent), the exact colour of the ground behind it. See the INK
// note in app/quiz/[id]/JoinLeaderboardForm.jsx. Unset on the light surfaces
// (the claim-your-name modals) the fallbacks apply and nothing changes.
const INK = {
  body: `var(--join-body, ${T.ink})`,
  soft: `var(--join-soft, ${T.slate})`,
  loud: `var(--join-loud, ${T.accent})`,
  ok: `var(--join-ok, ${T.successDeep})`,
};

// The server says `username_taken` when a name is already registered. That is the
// exact moment a locked-out player needs this, so callers pass the error text and
// the link gets louder.
export function isLockedOut(err) {
  return typeof err === 'string' && /already registered|belongs to a different account/i.test(err);
}

// EmailLockNote — "no email means this name only works on this browser."
//
// WHY THIS EXISTS. A name-only account is keyed by the browser's anon_id and
// nothing else, so it cannot be reconnected anywhere else, by anyone, including
// its owner: resolveQuizIdentity has no key to find it by. The six join forms
// called the email "optional" and said nothing about that, so players took the
// option and only learned what it cost on their second device, at which point
// the one fix is a human (see the header of /api/admin/quiz-relink).
//
// Lives beside SigninHelp for the reason SigninHelp's own header gives: these
// forms are five near-identical copies, and one component is what stops a change
// landing on only some of them. Renders nothing once an email is typed, so it is
// advice about a choice the player is still making rather than a standing scold.
export function EmailLockNote({ email = '', style = null }) {
  if ((email || '').trim()) return null;
  return (
    <p style={{ fontFamily: FONT, fontSize: 11.5, lineHeight: 1.45, color: INK.soft, margin: '6px 0 0', ...(style || {}) }}>
      Without an email, this name only works on this browser. Add one and you can sign back in on any device.
    </p>
  );
}

export default function SigninHelp({ name = '', email = '', prominent = false }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (busy) return;
    setBusy(true);
    // The anon id is the key an editor needs to relink the account, so attach it
    // rather than relying on the player to describe their problem precisely.
    let ctx = '';
    try {
      let anon = '';
      try { anon = localStorage.getItem('sot_quiz_anon') || ''; } catch (e) {}
      ctx = `\n\n---\nTried display name: ${(name || '').trim() || '(blank)'}`
          + `\nEmail given: ${(email || '').trim() || '(none)'}`
          + `\nBrowser id: ${anon || '(none)'}`
          + `\nPage: ${window.location.pathname}`;
    } catch (e) { /* context is a bonus, never a blocker */ }
    try {
      await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: 'signin-help',
          listTitle: `[Sign-in] ${(name || '').trim() || 'unknown player'}`.slice(0, 200),
          message: (msg.trim() || 'Cannot sign back in.') + ctx,
          name: (name || '').trim(),
          email: (email || '').trim(),
        }),
      });
    } catch (e) { /* best effort: acknowledge either way */ }
    setSent(true);
    setBusy(false);
  }

  if (sent) {
    return (
      <p style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: INK.ok, margin: '12px 0 0' }}>
        Thanks. That went to the editors with your details, and someone will reconnect your account.
      </p>
    );
  }

  if (open) {
    return (
      <div style={{ marginTop: 12 }}>
        <p style={{ fontFamily: FONT, fontSize: 12.5, color: INK.body, margin: '0 0 8px' }}>
          Tell us what happens when you try. Your display name and browser details are attached automatically.
        </p>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={3}
          placeholder="e.g. it says my display name is already registered"
          style={{
            width: '100%', boxSizing: 'border-box', fontFamily: FONT, fontSize: 14, color: T.ink,
            border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', resize: 'vertical',
            background: T.white,
          }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={() => setOpen(false)}
            style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 700, background: 'transparent', border: 'none', color: INK.soft, cursor: 'pointer', padding: '8px 10px' }}
          >
            Cancel
          </button>
          <button
            onClick={send}
            disabled={busy}
            style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 800, background: T.cta, color: T.ctaInk, border: 'none', borderRadius: 8, padding: '9px 16px', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'Sending…' : 'Send to the editors'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      style={{
        marginTop: 12, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
        fontFamily: FONT, textAlign: 'left', textDecoration: 'underline',
        fontSize: prominent ? 13 : 12,
        fontWeight: prominent ? 800 : 600,
        color: prominent ? INK.loud : INK.soft,
      }}
    >
      {prominent
        ? 'This is my account and I cannot get back in. Report it →'
        : 'Trouble signing back in? Report an issue'}
    </button>
  );
}
