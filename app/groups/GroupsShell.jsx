'use client';
// THE GROUPS FRAME: the stage page, its one-line cap and the light switch.
// Shared by /groups and /groups/<code> so the two cannot drift. It follows the
// Stat Hub's pattern exactly: the root writes data-stage-theme from the shared
// store in lib/stage-theme, so the light switch here and the one on every game
// page are the same setting.
import React from 'react';
import Link from 'next/link';
import { useStageTheme } from '@/lib/stage-theme';
import { getVisitorId } from '@/lib/visitor';
import MindLoftMark from '../MindLoftMark';

// ── identity, read the way every quiz client reads it ─────────────────────
export function readIdentity() {
  if (typeof window === 'undefined') return { anonId: null, username: '', email: '' };
  let id = null;
  try { id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); } catch (e) { id = null; }
  return {
    anonId: getVisitorId(),
    username: (id && typeof id.username === 'string' && id.username) || '',
    email: (id && typeof id.email === 'string' && id.email) || '',
  };
}

export function saveIdentity(username, email) {
  try { localStorage.setItem('sot_quiz_identity', JSON.stringify({ username, email: email || '' })); } catch (e) {}
}

export function identityQs() {
  const me = readIdentity();
  const q = new URLSearchParams();
  if (me.anonId) q.set('anonId', me.anonId);
  if (me.email) q.set('email', me.email);
  return q.toString();
}

// A name for a guest who has not picked one, so joining is one tap. Always
// fifteen characters or fewer, the leaderboard limit.
const ADJ = ['Quiet', 'Swift', 'Bright', 'Lucky', 'Clever', 'Bold', 'Sunny', 'Brave', 'Calm', 'Keen', 'Witty', 'Merry'];
const ANI = ['Otter', 'Falcon', 'Fox', 'Heron', 'Lynx', 'Panda', 'Robin', 'Badger', 'Koala', 'Owl', 'Seal', 'Wren'];
export function suggestName() {
  const r = (n) => Math.floor(Math.random() * n);
  return `${ADJ[r(ADJ.length)]}${ANI[r(ANI.length)]}${10 + r(90)}`;
}

// Makes the name-only account /api/quiz/join makes everywhere else, and
// remembers it the same way. Returns { ok } or { error }.
export async function ensureAccount(name) {
  const me = readIdentity();
  const username = String(name || '').trim();
  if (!username) return { error: 'Pick a name for the board.' };
  if (username.length > 15) return { error: 'Names are 15 characters or fewer.' };
  try {
    const r = await fetch('/api/quiz/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email: me.email || undefined, anonId: me.anonId }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { error: d.error || 'Could not save that name. Try another.' };
    saveIdentity(d.username || username, d.email || me.email || '');
    return { ok: true, username: d.username || username };
  } catch (e) {
    return { error: 'Could not reach the server. Check your connection and try again.' };
  }
}

export async function groupAction(code, action, extra = {}) {
  const me = readIdentity();
  try {
    const r = await fetch(`/api/groups/${encodeURIComponent(code)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, anonId: me.anonId, email: me.email || undefined, ...extra }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { error: d.error || 'That did not work. Try again.', code: d.code, status: r.status };
    return d;
  } catch (e) {
    return { error: 'Could not reach the server. Check your connection and try again.' };
  }
}

export function inviteUrl(code) {
  if (typeof window === 'undefined') return `/g/${code}`;
  return `${window.location.origin}/g/${code}`;
}

// Share sheet where the device has one, the clipboard where it does not.
export async function shareInvite(code, name) {
  const url = inviteUrl(code);
  const text = `Join ${name} on Mind Loft. We rank each other on the daily puzzles. Code ${code}.`;
  try {
    if (navigator.share) { await navigator.share({ title: name, text, url }); return 'shared'; }
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled';
  }
  try { await navigator.clipboard.writeText(url); return 'copied'; } catch (e) { return 'failed'; }
}

// ── ET date helpers (the daily boards roll at Eastern midnight) ───────────
export function etTodayIso() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
export function shiftIso(iso, days) {
  const t = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}
export function suffixOfIso(iso) {
  const [Y, M, D] = iso.split('-').map(Number);
  return `${M}-${D}-${Y % 100}`;
}
export function labelOfIso(iso, today) {
  const d = new Date(`${iso}T12:00:00Z`);
  const s = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  return iso === today ? `Today · ${s}` : s;
}
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function Avatar({ name, userKey }) {
  let h = 0;
  const k = String(userKey || name || '');
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
  return <span className={`grp-av grp-av${h % 7}`} aria-hidden="true">{String(name || '?').slice(0, 2).toUpperCase()}</span>;
}

function ThemeGlyph({ theme }) {
  return theme === 'light' ? (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
    </svg>
  );
}

export default function GroupsShell({ eyebrow, children }) {
  const [theme, setTheme] = useStageTheme();
  return (
    <div className="stage-page grp-page" data-stage-theme={theme}
      style={{ '--stg-acc-dk': '#7dd3fc', '--stg-acc-lt': '#2563eb', '--stg-acc-ink-lt': '#2563eb', '--stg-onramp-lt': '#ffffff' }}>
      <style dangerouslySetInnerHTML={{ __html: GROUPS_CSS }} />
      <header className="grp-cap">
        <Link href="/" className="grp-mark" aria-label="Mind Loft home"><MindLoftMark size={17} /> <b>Mind <i>Loft</i></b></Link>
        <span className="grp-eb">{eyebrow}</span>
        <nav className="grp-capnav">
          <Link href="/groups" className="grp-chip">Your groups</Link>
          <button type="button" className="grp-chip grp-tg"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
            title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}>
            <ThemeGlyph theme={theme} />
          </button>
          <Link href="/" className="grp-chip">Today</Link>
        </nav>
      </header>
      <main className="grp-main">{children}</main>
    </div>
  );
}

// Every colour is a stage token, so both registers come from app/globals.css.
const GROUPS_CSS = `
.grp-page{min-height:100vh;background:var(--stg-ground);color:var(--stg-ink);font-family:Manrope,system-ui,-apple-system,sans-serif;}
.grp-page *{box-sizing:border-box;}
.grp-cap{display:flex;align-items:center;gap:16px;flex-wrap:wrap;max-width:1120px;margin:0 auto;padding:15px 24px 14px;border-bottom:1px solid var(--stg-line);}
.grp-mark{display:flex;align-items:center;gap:9px;text-decoration:none;color:var(--stg-ink);}
.grp-mark b{font-size:15.5px;font-weight:800;letter-spacing:-.2px;}
.grp-mark b i{font-style:normal;color:var(--stg-brand);}
.grp-eb{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-dim);}
.grp-capnav{display:flex;gap:8px;margin-left:auto;}
.grp-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--stg-line2);background:none;color:var(--stg-ink);border-radius:999px;padding:7px 13px;font:inherit;font-size:12px;font-weight:700;text-decoration:none;cursor:pointer;}
.grp-chip:hover{background:var(--stg-surf2);}
.grp-tg{padding:7px 10px;}
.grp-main{max-width:1120px;margin:0 auto;padding:22px 24px 80px;}
.grp-lbl{font-family:"DM Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-mute);}
.grp-h1{margin:6px 0 0;font-size:clamp(26px,4vw,36px);font-weight:800;letter-spacing:-.02em;line-height:1.08;text-wrap:balance;}
.grp-note{font-size:13.5px;color:var(--stg-ink2);line-height:1.5;margin:0;}
.grp-mute{color:var(--stg-mute);}
.grp-err{font-size:13px;font-weight:700;color:var(--stg-bad);margin:0;}
.grp-ok{font-size:13px;font-weight:700;color:var(--stg-good);margin:0;}
.grp-btn{border-radius:999px;padding:9px 16px;font:inherit;font-size:13.5px;font-weight:800;border:1px solid var(--stg-line2);background:none;color:var(--stg-ink);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;}
.grp-btn:hover{background:var(--stg-surf2);}
.grp-btn.solid{background:var(--stg-acc);border-color:var(--stg-acc);color:var(--stg-onramp);}
.grp-btn.solid:hover{filter:brightness(1.06);}
.grp-btn.danger{color:var(--stg-bad);}
.grp-btn:disabled{opacity:.5;cursor:default;}
.grp-btn:focus-visible,.grp-chip:focus-visible,.grp-tab:focus-visible,.grp-in:focus-visible,.grp-gbtn:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.grp-in{font:inherit;font-size:14px;border:1px solid var(--stg-cell-line);border-radius:10px;padding:9px 12px;background:var(--stg-cell);color:var(--stg-ink);min-width:0;}
.grp-in::placeholder{color:var(--stg-mute);}
.grp-code-in{font-family:"DM Mono",ui-monospace,monospace;letter-spacing:.2em;text-transform:uppercase;}
.grp-card{background:var(--stg-raise);border:1px solid var(--stg-line);border-radius:14px;}
.grp-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.grp-code{font-family:"DM Mono",ui-monospace,monospace;font-size:12.5px;letter-spacing:.16em;padding:7px 10px;border-radius:8px;background:var(--stg-surf2);color:var(--stg-ink);}
.grp-av{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:800;flex:none;color:var(--stg-onramp,#08222e);}
.grp-av0{background:#7dd3fc}.grp-av1{background:#6ee7b7}.grp-av2{background:#fb7185}.grp-av3{background:#c084fc}.grp-av4{background:#fbbf24}.grp-av5{background:#a5b4fc}.grp-av6{background:#e879f9}
.grp-page[data-stage-theme=light] .grp-av{color:#ffffff;}
.grp-page[data-stage-theme=light] .grp-av0{background:#1d4ed8}
.grp-page[data-stage-theme=light] .grp-av1{background:#047857}
.grp-page[data-stage-theme=light] .grp-av2{background:#be123c}
.grp-page[data-stage-theme=light] .grp-av3{background:#6d28d9}
.grp-page[data-stage-theme=light] .grp-av4{background:#9c5d02}
.grp-page[data-stage-theme=light] .grp-av5{background:#3949ab}
.grp-page[data-stage-theme=light] .grp-av6{background:#a21caf}
.grp-pill{font-family:"DM Mono",ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:999px;white-space:nowrap;display:inline-block;}
.grp-pill.gold{background:#e8b43a;color:#08222e;}
.grp-pill.wait{background:var(--stg-surf2);color:var(--stg-mute);}
.grp-pill.line{border:1px solid var(--stg-line2);color:var(--stg-ink2);}
.grp-tag{font-family:"DM Mono",ui-monospace,monospace;font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-mute);border:1px dashed var(--stg-line2);border-radius:999px;padding:1px 6px;margin-left:6px;vertical-align:1px;}
@media(max-width:560px){
  .grp-cap{padding-left:16px;padding-right:16px;gap:10px;}
  .grp-eb{display:none;}
  .grp-main{padding-left:16px;padding-right:16px;}
}
`;
