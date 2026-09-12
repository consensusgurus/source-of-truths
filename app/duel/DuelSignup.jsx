'use client';
import React, { useState } from 'react';
import { T } from '@/lib/theme';
import SigninHelp, { isLockedOut, EmailLockNote } from '../SigninHelp';

// Shared "claim your name" modal for the duel flow. A duel name is NOT free
// text: signed-in players use their registered display name, and guests must
// claim a name here first. /api/quiz/join rejects a name already taken by a
// registered player, so this closes the impersonation gap.
const C = { ink: T.ink, accent: T.accent, muted: T.muted, soft: T.muted, line: 'rgba(20,22,28,0.12)' };
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

export default function DuelSignup({ anonId, onDone, onClose }) {
  const [u, setU] = useState('');
  const [em, setEm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const inp = { width: '100%', boxSizing: 'border-box', border: `1px solid ${C.line}`, borderRadius: 10, padding: '11px 13px', fontFamily: FONT, fontSize: 15, color: C.ink, outline: 'none' };

  async function submit() {
    setErr('');
    const name = u.trim();
    if (!name) { setErr('Pick a display name.'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/quiz/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: name, email: em.trim() || undefined, anonId: anonId || undefined }) });
      const d = await r.json();
      if (d && d.username) {
        try { const j = JSON.parse(localStorage.getItem('sot_quiz_identity')) || {}; localStorage.setItem('sot_quiz_identity', JSON.stringify({ ...j, username: d.username, email: d.email || j.email })); } catch (e) {}
        onDone && onDone(d.username);
      } else { setErr((d && d.error) || 'Could not sign up. Try again.'); setBusy(false); }
    } catch (e) { setErr('Could not sign up. Try again.'); setBusy(false); }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(20,22,28,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: '100%', background: T.white, borderRadius: 14, border: `1px solid ${C.line}`, padding: 22, fontFamily: FONT }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Claim your name</div>
        <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px', lineHeight: 1.5 }}>Pick the display name you will duel under. It shows on the leaderboard and the duel card. Email is optional, only to recover your name on another device. No password needed.</p>
        {err && <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.4)', color: T.danger, fontSize: 13 }}>{err}</div>}
        <input value={u} onChange={(e) => setU(e.target.value)} placeholder="Display name" maxLength={15} style={inp} />
        <input value={em} onChange={(e) => setEm(e.target.value)} placeholder="Email (optional)" maxLength={120} style={{ ...inp, marginTop: 10 }} />
        <EmailLockNote email={em} />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: '0 0 auto', background: T.white, color: C.muted, border: `1px solid ${C.line}`, borderRadius: 10, padding: '12px 16px', fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={busy} style={{ flex: '1 1 auto', background: C.accent, color: T.white, border: 'none', borderRadius: 10, padding: '12px', fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}>{busy ? 'Claiming...' : 'Claim name & continue'}</button>
          <SigninHelp name={u} email={em} prominent={isLockedOut(err)} />
        </div>
      </div>
    </div>
  );
}
