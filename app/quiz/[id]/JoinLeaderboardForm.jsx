'use client';
import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { ensureMyRefCode } from '@/lib/referrals';
import { T } from '@/lib/theme';
import SigninHelp, { isLockedOut, EmailLockNote } from '../../SigninHelp';

// Shared "Join the Leaderboard" sign-up form for every quiz board. Self-manages
// its name/email fields (email optional, display name capped at 15). onJoined(id)
// fires after a successful join so the board can update its own identity and
// navigate; onViewLeaderboard switches to the leaderboard tab.
const C = { ember: T.accent, ink: T.ink, faded: T.muted, forest: T.success };
// INK: this form's text colours, as CSS custom properties with the light-page
// value as the fallback.
//
// WHY. The form sets its colours INLINE, and inline beats a stylesheet at any
// specificity, so a dark page cannot re-ink it with an ordinary rule. It is
// rendered straight onto the navy ground of every daily Loft page, where the
// whole block shipped in near-black (owner, 2026-08-17: the "see your stats and
// join the leaderboard" text "blends into the navy background"). Measured on the
// live page before the fix: the heading ran 1.8:1 against that ground, the two
// intro paragraphs and the field labels 1.0 to 1.1:1, and the prominent
// SigninHelp link was var(--accent), the EXACT colour of the ground.
//
// A var with a fallback is the one mechanism that lets a single rule move all of
// them without an !important war. app/LoftCap.jsx sets the navy values under
// .loft-page. Unset everywhere else (the /quiz boards, the claim-your-name
// modals, ShareCreditPop) the fallbacks apply and nothing changes.
//
// The INPUT FIELDS and the BUTTON read tokens too (owner, 2026-09-01: on a
// daily page the form has to wear that game's colours, and it wore the site's
// CTA blue and a white field on every one of the ten categories). .stage-page
// publishes --join-cta / --join-cta-ink / --join-field-* off its own category
// step in app/globals.css; everywhere else the fallbacks keep the old look.
const INK = {
  head: `var(--join-head, ${T.ink})`,
  body: 'var(--join-body, #4a4339)',
  soft: `var(--join-soft, ${T.muted})`,
  ok: `var(--join-ok, ${T.success})`,
  err: `var(--join-err, ${T.accent})`,
};
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const labelStyle = { display: 'block', fontFamily: FONT, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK.soft, marginBottom: 6 };
const fieldStyle = { width: '100%', fontFamily: FONT, fontSize: 16, padding: '12px 14px', borderRadius: 10, border: `1.5px solid var(--join-field-line, ${C.ink})`, background: `var(--join-field-bg, ${T.white})`, color: `var(--join-field-ink, ${C.ink})`, boxSizing: 'border-box' };

function getAnonId() {
  if (typeof window === 'undefined') return null;
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) {
      a = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('sot_quiz_anon', a);
    }
    return a;
  } catch (e) { return null; }
}

export default function JoinLeaderboardForm({ identity, onJoined, onViewLeaderboard, heading = 'Join the Leaderboard', hideIcon = false }) {
  const [jName, setJName] = useState(identity ? identity.username || '' : '');
  const [jEmail, setJEmail] = useState(identity ? identity.email || '' : '');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  // Set when the server reports the display name is taken and no email was sent:
  // the name may well be the player's own, claimed on another device, and the
  // email is the only thing that can reconnect it here.
  const [recover, setRecover] = useState(false);
  // The display name as the SERVER knows it. localStorage is a cache written at
  // join time and never revised, so after an admin rename it still holds the old
  // name. Submitting this form patches whatever name it is given straight onto
  // quiz_users (resolveQuizIdentity), so seeding the field from that stale cache
  // let a player silently rename themselves BACK by opening the form and
  // pressing the button. The server value always wins.
  const [srvName, setSrvName] = useState(null);

  useEffect(() => {
    // Only overwrite from the identity cache while the server has not answered.
    if (identity && !srvName) { setJName(identity.username || ''); setJEmail(identity.email || ''); }
  }, [identity, srvName]);
  useEffect(() => {
    let live = true;
    try {
      const params = new URLSearchParams();
      const anonId = getAnonId();
      if (anonId) params.set('anonId', anonId);
      let mail = '';
      try { const s = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); mail = (s && s.email) || ''; } catch (e) {}
      if (mail) params.set('email', mail);
      if (!anonId && !mail) return undefined;
      params.set('light', '1');
      fetch(`/api/quiz/me?${params.toString()}`)
        .then((r) => r.json())
        .then((d) => {
          if (!live || !d || !d.signed) return;
          const real = d.name || d.username || '';
          if (!real) return;
          setSrvName(real);
          setJName(real);
          // Heal the cache so every other surface reading it (the player chip,
          // the duel name posted by /api/duel/create) stops showing the old name.
          try {
            const s = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
            if (s && s.username !== real) localStorage.setItem('sot_quiz_identity', JSON.stringify({ ...s, username: real }));
          } catch (e) {}
        })
        .catch(() => {});
    } catch (e) {}
    return () => { live = false; };
  }, []);

  async function submit() {
    setErr(false);
    setRecover(false);
    if (!jName.trim() || jName.trim().length > 15) { setErr(true); setMsg('Pick a display name (max 15 characters).'); return; }
    if (jEmail.trim() && !EMAIL_RE.test(jEmail.trim())) { setErr(true); setMsg('Enter a valid email or leave it blank.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/quiz/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: jName.trim(), email: jEmail.trim() || undefined, anonId: getAnonId() }) });
      const d = await res.json();
      if (d.error) {
        setErr(true);
        setMsg(d.error);
        if (d.recoverable) setRecover(true);
        setBusy(false);
        return;
      }
      const id = { username: d.username, email: d.email };
      try { localStorage.setItem('sot_quiz_identity', JSON.stringify(id)); } catch (e) {}
      // Resolve this player's referral code now so their very next share link
      // carries it, rather than waiting for the next page load.
      ensureMyRefCode();
      setErr(false);
      // A name-only account is browser-locked and has no self-service way back
      // on a second device, so the moment it is created is the last cheap chance
      // to say so. d.email is what the SERVER stored, not what was typed.
      setMsg(d.email
        ? `You're in. "${d.username}" is on the leaderboard, including any games you already finished.`
        : `You're in. "${d.username}" is on the leaderboard, including any games you already finished. Add an email above and press the button again so you can sign back in on another device.`);
      if (onJoined) onJoined(id);
      // On a daily-game page, loop the newly-registered player back to that
      // game's leaderboard so they see their score land. No-op elsewhere (the
      // /quiz join tab has no #daily-leaderboard; onJoined handles navigation).
      try {
        if (typeof document !== 'undefined') {
          const lb = document.getElementById('daily-leaderboard');
          if (lb) setTimeout(() => { lb.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
        }
      } catch (e) {}
    } catch (e) {
      setErr(true); setMsg('Could not join right now. Try again.');
    }
    setBusy(false);
  }

  return (
    <div id="daily-join" style={{ maxWidth: 440, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {!hideIcon && <Trophy size={22} strokeWidth={2.2} style={{ color: `var(--stg-acc-ink,${C.ember})` }} />}
        <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, margin: 0, color: INK.head }}>{heading}</h2>
      </div>
      <p style={{ fontFamily: FONT, fontSize: 15, color: INK.body, margin: '0 0 6px' }}>
        Sign Up with a display name and it appears on the leaderboard after you finish a game. No password needed.
      </p>
      <p style={{ fontFamily: FONT, fontSize: 12, color: INK.soft, margin: '0 0 22px' }}>
        Your display name is shown publicly. Email is optional, required only for prizes, and kept private.
      </p>
      <label style={labelStyle}>Display name</label>
      <input value={jName} onChange={(e) => setJName(e.target.value)} maxLength={15} placeholder="Display name" autoCapitalize="none" autoCorrect="off" spellCheck={false} style={fieldStyle} />
      <label style={{ ...labelStyle, marginTop: 16 }}>
        {recover ? 'Email (enter the one you signed up with)' : 'Email (optional, required for prizes)'}
      </label>
      <input
        value={jEmail}
        onChange={(e) => setJEmail(e.target.value)}
        type="email"
        placeholder={recover ? 'you@email.com' : 'you@email.com (optional)'}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={recover}
        style={recover ? { ...fieldStyle, borderColor: C.ember } : fieldStyle}
      />
      {!recover && <EmailLockNote email={jEmail} />}
      <button onClick={submit} disabled={busy} style={{ marginTop: 22, width: '100%', fontFamily: FONT, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, lineHeight: '48px', border: 'none', borderRadius: 10, background: `var(--join-cta, ${T.cta})`, color: `var(--join-cta-ink, ${T.ctaInk})`, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
        {busy ? 'Joining…' : identity ? 'Update my name' : 'Join the leaderboard'}
      </button>
      {msg && (<p style={{ fontFamily: FONT, fontSize: 12, marginTop: 14, color: err ? INK.err : INK.ok }}>{msg}</p>)}
      {identity && !msg && (<p style={{ fontFamily: FONT, fontSize: 12, marginTop: 14, color: INK.soft }}>You're signed up as "{srvName || identity.username}". Finish a game to post your score.</p>)}
      <SigninHelp name={jName} email={jEmail} prominent={recover || isLockedOut(msg)} />
      {onViewLeaderboard && (
        <button onClick={onViewLeaderboard} style={{ marginTop: 18, background: 'transparent', border: 'none', color: INK.soft, cursor: 'pointer', fontFamily: FONT, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'underline', padding: 0 }}>
          View the leaderboard →
        </button>
      )}
    </div>
  );
}
