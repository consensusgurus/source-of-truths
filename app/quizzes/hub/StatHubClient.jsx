'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Flame, Share2, Download, UserPlus, Play, X, Check, Star, Swords, ChevronDown, Crown, Target } from 'lucide-react';
import { QUIZZES, getQuiz } from '@/lib/quizzes';
import { DAILY_GAMES, DAILY_DATED_RE, dailyLabel, dailyDept } from '@/lib/daily-games';
import { quizDept as deptOf, DEPT_COLOR, DEPT_LABEL, DEPT_NAV } from '@/lib/quiz-departments';
import DailyCombinedLeaderboard from '../../quiz/[id]/DailyCombinedLeaderboard';
import { withRef } from '@/lib/referrals';
import { Metric, ActivityFeed, XpPanel, TrophyCase } from '../../player/ProfileShared';
import { T } from '@/lib/theme';
import SigninHelp, { isLockedOut, EmailLockNote } from '../../SigninHelp';
import { useStageTheme } from '@/lib/stage-theme';
import ThemePop from '../../ThemePop';
import MindLoftMark from '../../MindLoftMark';

const C = {
  bg: 'var(--stg-ground,#0b0f1a)',
  surface: 'var(--stg-surf,rgba(255,255,255,0.045))',
  ink: 'var(--stg-ink,#e9edf4)',
  muted: 'var(--stg-mute,#8b95a8)',
  soft: 'var(--stg-dim,#747f97)',
  line: 'var(--stg-line,rgba(255,255,255,0.11))',
  accent: 'var(--stg-acc,#7dd3fc)',
  accsoft: 'var(--stg-surf2,rgba(255,255,255,0.08))',
  live: 'var(--stg-up,#6ee7b7)',
  danger: 'var(--stg-dn,#fb7185)',
};
// Ink that rides ON the accent (and on a medal). The accent is a pale step on
// the dark register and a deep one on the light register, so this flips with it
// and a literal cannot be used in either place.
const ON_ACC = 'var(--stg-onramp,#08222e)';
// A raised surface: a modal sheet, a menu, a key. Not the page ground.
const RAISE = 'var(--stg-raise,#0e131f)';
// GOLD, SILVER AND BRONZE ARE A PALETTE, AND THE STAGE HAS TWO REGISTERS.
// These were three literals picked against a near-black page: on the light
// register the silver ink is 1.3:1 on white and the gold 1.9:1, so a podium
// rendered as three blank rows. Each is a var with the DARK value as its
// fallback, and the light triple is declared beside the rest of the hub's
// tokens further down (search --hmi1). Same rule as everywhere else on the
// stage: a meaning colour is a token, never a literal.
const MEDAL = ['var(--hm1,#e8b43a)', 'var(--hm2,#b8bcc4)', 'var(--hm3,#c8814b)'];
const MEDAL_INK = ['var(--hmi1,#e8b43a)', 'var(--hmi2,#c9ced6)', 'var(--hmi3,#d79a6a)'];
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
const MEDAL_BG = ['var(--hmb1,rgba(232,180,58,0.16))', 'var(--hmb2,rgba(255,255,255,0.10))', 'var(--hmb3,rgba(200,129,75,0.18))'];
// The gold a label or a crown is written IN, as opposed to the wash it sits on.
// Same var as the medal's own ink so a podium and a crown cannot disagree.
const GOLD_INK = 'var(--hmi1,#e8b43a)';
// Rank bubble. #1/#2/#3 render in gold/silver/bronze; everything else accent blue.
// RankChip, Metric, ChipMetric, CAT_COLS, completedPct, CategoryView,
// ActivityFeed, XpPanel, and the new TrophyCase moved to
// app/player/ProfileShared.jsx (2026-07-31), shared with the public
// /player/[name] profile page. Imported above; edit them THERE.

function cleanTitle(t) { return (t || '').replace(/^Name (the )?/i, '').trim(); }
function getAnonId() { if (typeof window === 'undefined') return null; try { return localStorage.getItem('sot_quiz_anon'); } catch { return null; } }
function getIdentity() { if (typeof window === 'undefined') return null; try { return JSON.parse(localStorage.getItem('sot_quiz_identity')); } catch { return null; } }
function getEmail() { const j = getIdentity(); return (j && j.email) || ''; }
function mmss(s) { if (!Number.isFinite(s)) return '—'; const m = Math.floor(s / 60); const sec = Math.round(s % 60); return `${m}:${String(sec).padStart(2, '0')}`; }


// Brand mark (gradient ids suffixed per render so multiple instances stay unique).
let __logoSeq = 0;
// Aggregate play-time, big-number friendly: seconds -> "2mo 3d 5h 12m" (30-day
// months). Always shows at least minutes so it never renders empty.
function fmtPlayTime(totalSec) {
  let s = Math.max(0, Math.round(Number(totalSec) || 0));
  const mo = Math.floor(s / (30 * 86400)); s -= mo * 30 * 86400;
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60);
  const parts = [];
  if (mo) parts.push(`${mo}mo`);
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

function Logo({ size = 22 }) {
  return <MindLoftMark size={size} />;
}

// eslint-disable-next-line no-unused-vars -- size default kept at 22

// The jump bar and the page are the same list, so a section cannot be added to
// one and forgotten in the other.
const SECTIONS = [
  { id: 'standing', label: 'Standing' },
  { id: 'today', label: 'Today' },
  { id: 'quizzes', label: 'Quizzes' },
  { id: 'trophies', label: 'Trophies' },
  { id: 'level', label: 'IQ' },
  { id: 'activity', label: 'Activity' },
  { id: 'duels', label: 'Duels' },
  { id: 'community', label: 'Community' },
];

// A section on the stage is a heading and a hairline, never a card: a raised
// panel on a near-black ground is a second ground nobody asked for.
function Section({ id, title, sub, right, children }) {
  return (
    <section id={id} className="hubsec">
      <div className="hubsec-head">
        <h2>{title}</h2>
        {sub ? <span className="hubsec-sub">{sub}</span> : null}
        {right ? <span className="hubsec-right">{right}</span> : null}
      </div>
      {children}
    </section>
  );
}

// The referral board. /quizzes/leaderboard redirects here, so this is the only
// place it can live; the share link sits beside it because the board and the
// one action it asks for belong on the same screen.
function CommunityPanel({ data }) {
  const [copied, setCopied] = useState(false);
  const top = (data && data.top) || [];
  const mine = data && data.me;
  const max = top.length ? Math.max(...top.map((r) => r.credits || 0)) : 0;
  if (!data) return <div className="hubempty">Loading the community board…</div>;
  return (
    <div>
      {mine && mine.shareUrl ? (
        <div className="hubshare">
          <div>
            <div className="hublab">Your share link</div>
            <code className="hublink">{mine.shareUrl.replace(/^https?:\/\//, '')}</code>
          </div>
          <button className="hubchip" onClick={() => {
            try { navigator.clipboard.writeText(mine.shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch (e) {}
          }}>{copied ? 'Copied' : 'Copy link'}</button>
        </div>
      ) : null}
      <p className="hubnote">Someone who opens your link is credited to you the first time they finish a
        game. The window rolls, so this is who is bringing people in now, not who did once.</p>
      {top.length ? (
        <div className="card" style={{ padding: '4px 14px 8px', marginTop: 14 }}>
          <table>
            <thead><tr><th style={{ width: 44 }}>#</th><th>Player</th><th style={{ textAlign: 'right' }}>Brought in</th><th className="lbar" style={{ width: '38%' }} /></tr></thead>
            <tbody>
              {top.map((r, i) => {
                const me = mine && r.username === mine.username;
                return (
                  <tr key={r.refCode || r.username || i} style={me ? { background: C.accsoft } : undefined}>
                    <td style={{ fontWeight: i < 3 ? 800 : 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: me ? 800 : 600 }}>{r.username}{me ? <span className="hubyou">you</span> : null}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>{r.credits}</td>
                    <td className="lbar"><span className="hubbar"><span style={{ width: `${max ? Math.round((r.credits / max) * 100) : 0}%`, background: me ? C.accent : 'var(--stg-line3,rgba(255,255,255,0.42))' }} /></span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <div className="hubempty">No one on the board yet.</div>}
    </div>
  );
}


// Share Stats: a shareable player card (overall rank, level + tier + IQ Points,
// completed/correct/accuracy with their ranks, top-3 categories) plus a copy
// link to this player's Stat Hub profile (?player=<key>).
// Sign-up popup (mirrors the Browse Quizzes one): claim a display name (email
// optional) so the player's name shows on the leaderboards.
function SignupModal({ onClose }) {
  const [u, setU] = useState('');
  const [em, setEm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const inp = { width: '100%', boxSizing: 'border-box', border: `1px solid ${C.line}`, borderRadius: 10, padding: '11px 13px', fontFamily: FONT, fontSize: 15, color: C.ink, outline: 'none' };
  async function submit() {
    setErr('');
    if (!u.trim()) { setErr('Pick a display name'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/quiz/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u.trim(), email: em.trim() || undefined, anonId: getAnonId() }) });
      const d = await r.json();
      if (d && d.username) {
        try { localStorage.setItem('sot_quiz_identity', JSON.stringify({ username: d.username, email: d.email || undefined })); } catch (e) {}
        window.location.reload();
      } else { setErr((d && d.error) || 'Could not sign up. Try again.'); setBusy(false); }
    } catch (e) { setErr('Could not sign up. Try again.'); setBusy(false); }
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(3,6,14,0.66)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: '100%', background: RAISE, borderRadius: 14, border: `1px solid ${C.line}`, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>Claim your name</div>
          <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.soft, display: 'flex' }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px', lineHeight: 1.5 }}>Pick a display name to appear on the leaderboards. Email is optional, only used to recover your name on another device. No password needed.</p>
        {err && <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: 'rgba(251,113,133,0.10)', border: '1px solid rgba(192,57,43,0.4)', color: C.danger, fontSize: 13 }}>{err}</div>}
        <input value={u} onChange={(e) => setU(e.target.value)} placeholder="Display name" maxLength={15} style={inp} />
        <input value={em} onChange={(e) => setEm(e.target.value)} placeholder="Email (optional)" maxLength={120} style={{ ...inp, marginTop: 10 }} />
        <EmailLockNote email={em} />
        <button onClick={submit} disabled={busy} style={{ marginTop: 16, width: '100%', background: C.accent, color: ON_ACC, border: 'none', borderRadius: 10, padding: '12px', fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}>{busy ? 'Joining…' : 'Join the leaderboard'}</button>
        <SigninHelp name={u} email={em} prominent={isLockedOut(err)} />
      </div>
    </div>
  );
}

function ShareStatsModal({ profile, byKey, onClose }) {
  const [copied, setCopied] = useState(false);
  const a = profile.activity || {};
  const r = profile.ranks || {};
  const cats3 = Object.entries(profile.byCategory || {})
    .filter(([, v]) => (v.matches || 0) > 0)
    .sort((x, y) => (y[1].xp || 0) - (x[1].xp || 0))
    .slice(0, 3);
  const maxR = cats3.length ? Math.max(...cats3.map(([, v]) => v.xp || 0), 1) : 1;
  const label = (k) => (byKey && byKey[k] && byKey[k].label) || k;
  function copy() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mindloftdaily.com';
    const url = withRef(!profile.isAnon && profile.name
      ? `${origin}/player/${encodeURIComponent(profile.name)}`
      : `${origin}/quizzes/hub?player=${encodeURIComponent(profile.userKey || '')}`);
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {});
  }
  const cell = { background: C.bg, borderRadius: 12, padding: '12px 13px' };
  const lbl = { fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(20,22,28,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 440, maxWidth: '100%', background: RAISE, borderRadius: 16, border: `1px solid ${C.line}`, overflow: 'hidden', color: C.ink }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${C.line}` }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Logo size={20} /><span style={{ fontWeight: 800, fontSize: 14 }}>Mind Loft</span></span>
          <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.soft, display: 'flex' }}><ArrowLeft size={0} /><span style={{ fontSize: 20, lineHeight: 1 }}>&times;</span></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 18px 12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</div>
            <div style={{ marginTop: 5 }}><span style={{ background: C.accsoft, color: C.ink || C.muted, fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>{(profile.tier || '').replace(/ Tier$/, '')}</span> <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Level {profile.level || 1} · {Number(profile.xp || 0).toLocaleString()} IQ</span></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={lbl}>Overall rank</div>
            <div style={{ fontSize: 38, fontWeight: 800, color: C.accent, lineHeight: 0.95 }}>{profile.rank ? `#${profile.rank}` : '—'}</div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{profile.totalPlayers ? `of ${profile.totalPlayers.toLocaleString()} players` : ''}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, padding: '0 18px 4px' }}>
          <div style={cell}><div style={lbl}>Completed</div><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}><span style={{ fontSize: 21, fontWeight: 800 }}>{a.completed != null ? a.completed : '—'}</span>{r.completed ? <span style={{ background: C.accsoft, color: C.accent, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 5 }}>#{r.completed}</span> : null}</div></div>
          <div style={cell}><div style={lbl}>Correct</div><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}><span style={{ fontSize: 21, fontWeight: 800 }}>{a.correct != null ? a.correct.toLocaleString() : '—'}</span>{r.correct ? <span style={{ background: C.accsoft, color: C.accent, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 5 }}>#{r.correct}</span> : null}</div></div>
          <div style={cell}><div style={lbl}>Accuracy</div><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}><span style={{ fontSize: 21, fontWeight: 800 }}>{a.accuracy != null ? `${a.accuracy}%` : '—'}</span>{r.accuracy ? <span style={{ background: C.accsoft, color: C.accent, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 5 }}>#{r.accuracy}</span> : null}</div></div>
        </div>
        {cats3.length ? (
          <div style={{ padding: '14px 18px 4px' }}>
            <div style={{ ...lbl, marginBottom: 10 }}>Top categories</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cats3.map(([k, v]) => (
                <div key={k}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}><span style={{ fontSize: 12.5, fontWeight: 700 }}>{label(k)}</span><span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{Number(v.xp || 0).toLocaleString()} IQ</span></div>
                  <div style={{ height: 8, background: C.bg, borderRadius: 5, overflow: 'hidden' }}><div style={{ width: `${Math.round(((v.xp || 0) / maxR) * 100)}%`, height: '100%', background: C.accent }} /></div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 9, padding: '16px 18px 18px' }}>
          <button onClick={copy} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: C.accent, color: ON_ACC, border: 'none', borderRadius: 10, padding: '11px 14px', fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}><Share2 size={15} strokeWidth={2.4} /> {copied ? 'Link copied!' : 'Copy share link'}</button>
          <a href={`/api/quiz/share-card?key=${encodeURIComponent(profile.userKey || '')}`} target="_blank" rel="noopener noreferrer" download="source-of-truths-stats.png" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: `1px solid ${C.line}`, background: RAISE, color: C.ink, borderRadius: 10, padding: '11px 14px', fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}><Download size={15} strokeWidth={2.4} /> Image</a>
          <button onClick={onClose} style={{ border: `1px solid ${C.line}`, background: RAISE, color: C.ink, borderRadius: 10, padding: '11px 16px', fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Duels tab ──────────────────────────────────────────────────────────────
// Shared bits for the Duel Arena: initials avatars, last-5 form dots, and the
// win-rate ring. All derive from data the ladder/list APIs already return.
function initialsOf(name) {
  const s = String(name || '').trim();
  if (!s) return '?';
  const parts = s.split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}
function duelStreakOf(matches) {
  const ms = matches || [];
  if (!ms.length || ms[0].result === 'tie') return null;
  let n = 0;
  for (const m of ms) { if (m.result === ms[0].result) n += 1; else break; }
  return { kind: ms[0].result, n };
}
function Avatar({ name, bg, fg, size = 34 }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: Math.max(11, Math.round(size * 0.35)), flex: 'none' }}>{initialsOf(name)}</span>;
}
// Last-5 duel results as dots, oldest to newest left to right.
function FormDots({ results }) {
  const seq = (results || []).slice(0, 5).reverse();
  if (!seq.length) return null;
  return (
    <span title="Last 5 duels, oldest to newest" style={{ display: 'inline-flex', gap: 3, flex: 'none' }}>
      {seq.map((r, i) => <span key={i} className="fdot" style={{ background: r === 'win' ? C.live : r === 'loss' ? C.danger : 'var(--stg-line2,rgba(255,255,255,0.17))' }} />)}
    </span>
  );
}
function WinRing({ pct, size = 40 }) {
  const r = size / 2 - 3.5;
  const circ = 2 * Math.PI * r;
  const on = (Math.max(0, Math.min(100, pct || 0)) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ flex: 'none' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.accsoft} strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.accent} strokeWidth="5" strokeDasharray={`${on} ${circ - on}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

function DuelsPanel({ data, setData, ladder, loaded, onSelectPlayer }) {
  const [muteAll, setMuteAll] = useState(false);
  const [muted, setMuted] = useState({});
  const [openLadder, setOpenLadder] = useState(null); // anon of the expanded ladder row
  useEffect(() => {
    try { setMuteAll(localStorage.getItem('sot_duel_mute_all') === '1'); } catch {}
    try { setMuted(JSON.parse(localStorage.getItem('sot_duel_muted') || '{}') || {}); } catch {}
  }, []);
  function toggleMuteAll() { setMuteAll((v) => { const n = !v; try { localStorage.setItem('sot_duel_mute_all', n ? '1' : '0'); } catch {} return n; }); }
  function unmute(a) { setMuted((m) => { const n = { ...m }; delete n[a]; try { localStorage.setItem('sot_duel_muted', JSON.stringify(n)); } catch {} return n; }); }
  const anon = getAnonId();
  // A duel's subject is a quiz OR a dated daily puzzle, so fall through to the
  // daily label rather than printing a raw 'crux-8-15-26' at the reader.
  const qtitle = (id) => { const q = getQuiz(id); return (q && q.title) || dailyLabel(id) || id; };
  const mutedEntries = Object.entries(muted);
  const card = { background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 14 };
  const hd = { fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: C.soft, margin: '0 0 10px' };
  // The other player in a duel, from the current player's perspective.
  const iAmChallenger = (d) => (d.mine ? d.mine === 'challenger' : d.challenger_anon === anon);
  function foeName(d) { return (iAmChallenger(d) ? d.opponent_name : d.challenger_name) || null; }
  function foeAnonOf(d) { return iAmChallenger(d) ? d.opponent_anon : d.challenger_anon; }
  // Turn down an incoming challenge. Only the challenged player may decline
  // (the API rejects a challenger declining their own duel).
  async function decline(d) {
    const a = getAnonId();
    if (!a) return;
    if (typeof window !== 'undefined' && !window.confirm('Decline this duel?')) return;
    const ident = getIdentity();
    const nm = (ident && ident.username) || 'Player';
    try {
      const r = await fetch('/api/duel/decline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: d.token, anonId: a, name: nm, email: (ident && ident.email) || undefined }) });
      const j = await r.json();
      if (j && j.duel) {
        setData((prev) => ({
          yourMove: prev.yourMove.filter((x) => x.token !== d.token),
          awaiting: prev.awaiting.filter((x) => x.token !== d.token),
          completed: [j.duel, ...prev.completed],
        }));
      }
    } catch (e) {}
  }
  // Dismiss your OWN pending invite (you are the challenger). Removes it from
  // Your Move for good; the opponent turns a duel down via decline instead.
  async function cancel(d) {
    const a = getAnonId();
    if (!a) return;
    if (typeof window !== 'undefined' && !window.confirm('Dismiss this duel invite?')) return;
    try {
      const r = await fetch('/api/duel/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: d.token, anonId: a, email: getEmail() || undefined }) });
      const j = await r.json();
      if (j && j.duel) {
        setData((prev) => ({
          yourMove: prev.yourMove.filter((x) => x.token !== d.token),
          awaiting: prev.awaiting.filter((x) => x.token !== d.token),
          completed: prev.completed,
        }));
      }
    } catch (e) {}
  }
  // 'win' | 'loss' | 'tie' | 'declined-them' (they passed) | 'declined-me'
  function outcomeOf(d) {
    if (d.status === 'declined') return iAmChallenger(d) ? 'declined-them' : 'declined-me';
    if (d.winner === 'tie') return 'tie';
    return ((iAmChallenger(d) && d.winner === 'challenger') || (!iAmChallenger(d) && d.winner === 'opponent')) ? 'win' : 'loss';
  }
  function myScores(d) {
    return iAmChallenger(d) ? { my: d.challenger_score, their: d.opponent_score } : { my: d.opponent_score, their: d.challenger_score };
  }
  // My ladder entry plus what the arena hero derives from it: streak and rival.
  const mine = useMemo(() => ladder.find((p) => p.anon === anon) || null, [ladder, anon]);
  const myPos = useMemo(() => (mine ? ladder.indexOf(mine) + 1 : null), [ladder, mine]);
  const streak = useMemo(() => duelStreakOf(mine && mine.matches), [mine]);
  // Rival = the player I have faced most (2+ duels), with our head-to-head.
  const rival = useMemo(() => {
    const ms = (mine && mine.matches) || [];
    const by = new Map();
    for (const m of ms) {
      const k = m.vsAnon || `n:${m.vs}`;
      let g = by.get(k);
      if (!g) { g = { anon: m.vsAnon || null, name: m.vs, met: 0, w: 0, l: 0, t: 0 }; by.set(k, g); }
      g.met += 1;
      if (m.result === 'win') g.w += 1; else if (m.result === 'loss') g.l += 1; else g.t += 1;
    }
    let best = null;
    for (const g of by.values()) if (g.met >= 2 && (!best || g.met > best.met)) best = g;
    return best;
  }, [mine]);
  const rivalKey = useMemo(() => {
    if (!rival || !rival.anon) return null;
    const row = ladder.find((p) => p.anon === rival.anon);
    return (row && row.key) || `a:${rival.anon}`;
  }, [rival, ladder]);
  const rematchHref = (nm, a2, quizId) => (a2
    ? `/duel/new?opponent=${encodeURIComponent(a2)}&oppName=${encodeURIComponent(nm || 'Player')}${quizId ? `&quiz=${encodeURIComponent(quizId)}` : ''}`
    : '/duel/new');
  const smallBtn = (clr) => ({ background: 'transparent', border: `1px solid ${C.line}`, color: clr, borderRadius: 8, padding: '5px 12px', fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: 'pointer', flex: 'none' });
  const empty = loaded && !data.yourMove.length && !data.awaiting.length && !data.completed.length;

  // A pending duel as a VS matchup card. Cards in Your Move pulse gently.
  function MoveCard({ d, pulse }) {
    const foe = foeName(d);
    const iAmCh = iAmChallenger(d);
    return (
      <div className={pulse ? 'duelpulse' : undefined} style={{ ...card, marginBottom: 8, padding: '13px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
            <Avatar name={(getIdentity() && getIdentity().username) || 'You'} bg={C.accsoft} fg={C.accent} />
            <span style={{ fontSize: 11, fontWeight: 800, color: C.soft }}>VS</span>
            <Avatar name={foe || '?'} bg="rgba(251,113,133,0.14)" fg={C.danger} />
          </span>
          <a href={`/duel/${d.token}`} style={{ flex: 1, minWidth: 150, textDecoration: 'none', color: C.ink }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>{foe ? (iAmCh ? <>You challenged <span style={{ color: C.accent }}>{foe}</span></> : <><span style={{ color: C.accent }}>{foe}</span> challenged you</>) : 'Open invite'}</span>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{qtitle(d.quiz_id)}</span>
          </a>
          {pulse && !iAmCh ? <span style={{ flex: 'none', fontSize: 10, fontWeight: 800, letterSpacing: '.05em', background: C.accsoft, color: C.accent, borderRadius: 999, padding: '4px 10px' }}>YOUR TURN</span> : null}
          {pulse && !iAmCh ? <button onClick={() => decline(d)} style={smallBtn(C.danger)}>Decline</button> : null}
          {pulse && iAmCh ? <button onClick={() => cancel(d)} style={smallBtn(C.muted)}>Dismiss</button> : null}
          {pulse ? (
            <a href={`/duel/${d.token}`} style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, background: C.accent, color: ON_ACC, borderRadius: 9, padding: '7px 14px', fontSize: 12.5, fontWeight: 800, textDecoration: 'none' }}><Play size={13} /> Play</a>
          ) : (
            <span style={{ flex: 'none', fontSize: 12, fontWeight: 700, color: C.soft }}>Pending</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>Duel Arena</div>
        <a href="/duel/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.accent, color: ON_ACC, padding: '10px 17px', borderRadius: 10, fontWeight: 800, fontSize: 13.5, textDecoration: 'none' }}><Swords size={16} /> Start a Duel</a>
      </div>

      {mine ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 14 }}>
          <div style={{ ...card, marginBottom: 0, padding: '12px 14px' }}>
            <div className="lbl">Your Record</div>
            <div style={{ fontSize: 25, fontWeight: 800, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{mine.wins}<span style={{ color: C.soft }}>-</span>{mine.losses}{mine.ties ? <><span style={{ color: C.soft }}>-</span>{mine.ties}</> : null}</div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>#{myPos} on the ladder</div>
          </div>
          <div style={{ ...card, marginBottom: 0, padding: '12px 14px' }}>
            <div className="lbl">Win Rate</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <WinRing pct={mine.winPct} size={38} />
              <span>
                <span style={{ display: 'block', fontSize: 19, fontWeight: 800 }}>{mine.winPct}%</span>
                <span style={{ display: 'block', fontSize: 10.5, color: C.muted, fontWeight: 600 }}>{mine.played} duel{mine.played === 1 ? '' : 's'}</span>
              </span>
            </div>
          </div>
          <div style={{ ...card, marginBottom: 0, padding: '12px 14px' }}>
            <div className="lbl">Streak</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 2 }}>
              {streak && streak.kind === 'win' && streak.n >= 2 ? <span className="flameon" style={{ display: 'inline-flex', color: 'var(--stg-warn,#fbbf24)' }}><Flame size={21} /></span> : null}
              <span style={{ fontSize: 23, fontWeight: 800, color: streak ? (streak.kind === 'win' ? C.live : C.danger) : C.soft }}>{streak ? `${streak.kind === 'win' ? 'W' : 'L'}${streak.n}` : '-'}</span>
            </div>
            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: C.soft, fontWeight: 800, letterSpacing: '.04em' }}>LAST 5</span>
              <FormDots results={(mine.matches || []).map((m) => m.result)} />
            </div>
          </div>
        </div>
      ) : (loaded && empty ? (
        <div style={{ ...card, padding: '14px 16px', color: C.muted, fontSize: 13.5, fontWeight: 600 }}>
          No duels yet. Challenge a friend or an open opponent, and your record, streak, and ladder spot show up here.
        </div>
      ) : null)}

      {rival ? (
        <div style={{ ...card, padding: '13px 14px', border: '1.5px solid rgba(232,180,58,0.42)', background: 'rgba(232,180,58,0.10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
              <Avatar name={rival.name} bg="rgba(232,180,58,0.16)" fg={GOLD_INK} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}><span style={{ color: GOLD_INK }}>Your rival:</span>{' '}
                  {rivalKey ? <button onClick={() => onSelectPlayer && onSelectPlayer(rivalKey)} style={{ border: 'none', background: 'transparent', padding: 0, font: 'inherit', fontFamily: FONT, fontWeight: 800, color: C.accent, cursor: 'pointer' }}>{rival.name}</button> : rival.name}
                </span>
                <span style={{ display: 'block', fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 1 }}>
                  {rival.w > rival.l ? `You lead ${rival.w}-${rival.l} all time. Keep it that way.` : rival.w < rival.l ? `You trail ${rival.w}-${rival.l} all time. One win closes the gap.` : `Dead even at ${rival.w}-${rival.l}. Next duel breaks the tie.`}
                </span>
              </span>
            </span>
            <a href={rematchHref(rival.name, rival.anon, null)} style={{ flex: 'none', fontSize: 12, fontWeight: 800, color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 8, padding: '6px 13px', textDecoration: 'none' }}>Rematch</a>
          </div>
        </div>
      ) : null}

      {data.yourMove.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={hd}>Your Move · {data.yourMove.length}</div>
          {data.yourMove.map((d) => <MoveCard key={d.token} d={d} pulse />)}
        </div>
      )}
      {data.awaiting.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={hd}>Waiting on Opponent</div>
          {data.awaiting.map((d) => <MoveCard key={d.token} d={d} />)}
        </div>
      )}

      {data.completed.length > 0 && (
        <div>
          <div style={hd}>Latest Duels</div>
          <div style={{ ...card, padding: '4px 14px' }}>
            {data.completed.slice(0, 8).map((d, i, arr) => {
              const o = outcomeOf(d);
              const foe = foeName(d);
              const fa = foeAnonOf(d);
              const sc = myScores(d);
              const chip = o === 'win' ? { t: 'WON', bg: 'rgba(110,231,183,0.14)', fg: 'var(--stg-up,#6ee7b7)' }
                : o === 'loss' ? { t: 'LOST', bg: 'rgba(251,113,133,0.14)', fg: C.danger }
                : o === 'tie' ? { t: 'TIE', bg: 'var(--stg-chip,rgba(255,255,255,0.08))', fg: C.muted }
                : { t: 'DECLINED', bg: 'var(--stg-chip,rgba(255,255,255,0.08))', fg: C.soft };
              return (
                <div key={d.token} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.line}` : 'none' }}>
                  <span style={{ flex: 'none', width: 62, textAlign: 'center', fontSize: 10, fontWeight: 800, borderRadius: 6, padding: '3px 0', background: chip.bg, color: chip.fg }}>{chip.t}</span>
                  <a href={`/duel/${d.token}`} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: C.ink }}>
                    <span style={{ flex: 'none', fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                      {Number.isFinite(sc.my) && Number.isFinite(sc.their) ? <>You {sc.my} - {sc.their} </> : null}
                      <span style={{ color: C.accent }}>{foe || 'Open invite'}</span>
                    </span>
                    <span className="duelqt" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: C.soft, fontWeight: 600 }}>{qtitle(d.quiz_id)}</span>
                  </a>
                  {(o === 'win' || o === 'loss' || o === 'tie') && foe ? (
                    <a href={rematchHref(foe, fa, d.quiz_id)} style={{ flex: 'none', fontSize: 11.5, fontWeight: 800, color: C.accent, textDecoration: 'none' }}>{o === 'loss' ? 'Avenge' : 'Rematch'}</a>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {empty && (<div style={{ ...card, color: C.muted, fontSize: 14 }}>No duels yet. Challenge someone to get started.</div>)}

      <div style={card}>
        <div style={hd}>Duel Ladder</div>
        {ladder.length === 0 ? <div style={{ color: C.muted, fontSize: 13 }}>No completed duels yet.</div> : ladder.slice(0, 15).map((p, i) => {
          const matches = Array.isArray(p.matches) ? p.matches : [];
          const open = openLadder === p.anon;
          const canOpen = matches.length > 0;
          const isMe = p.anon === anon;
          const mi = i < 3 ? i : -1;
          return (
            <div key={p.anon} style={{ borderBottom: `1px solid ${C.line}`, ...(isMe ? { background: C.accsoft, margin: '0 -16px', padding: '0 16px' } : {}) }}>
              <div
                onClick={() => canOpen && setOpenLadder(open ? null : p.anon)}
                role={canOpen ? 'button' : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', cursor: canOpen ? 'pointer' : 'default' }}
              >
                <span style={{ flex: 'none', width: 25, height: 25, borderRadius: '50%', background: mi >= 0 ? MEDAL_BG[mi] : 'var(--stg-chip,rgba(255,255,255,0.08))', color: mi >= 0 ? MEDAL_INK[mi] : C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11.5 }}>{i + 1}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); if (onSelectPlayer) onSelectPlayer(p.key || `a:${p.anon}`); }}
                  title="View profile"
                  style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isMe ? 800 : 700, fontSize: 14, color: C.accent, cursor: 'pointer' }}
                >{p.name}{isMe ? <span style={{ fontSize: 9.5, color: C.accent, fontWeight: 800, marginLeft: 6 }}>YOU</span> : null}</span>
                <span style={{ flex: 'none', fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{p.wins}-{p.losses}{p.ties ? `-${p.ties}` : ''}</span>
                <span className="lbar" style={{ flex: 'none', width: 86, height: 7, borderRadius: 999, background: isMe ? 'var(--stg-line3,rgba(255,255,255,0.42))' : C.accsoft, overflow: 'hidden' }}><span style={{ display: 'block', width: `${Math.max(3, Math.min(100, p.winPct || 0))}%`, height: '100%', background: C.accent, borderRadius: 999 }} /></span>
                <span style={{ flex: 'none', fontSize: 12, fontWeight: 800, color: C.muted, width: 38, textAlign: 'right' }}>{p.winPct}%</span>
                <span className="lform"><FormDots results={matches.map((m) => m.result)} /></span>
                <ChevronDown size={15} style={{ flex: 'none', color: C.soft, opacity: canOpen ? 1 : 0.25, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
              </div>
              {open && canOpen && (
                <div style={{ padding: '2px 0 10px 35px' }}>
                  {matches.map((m, j) => {
                    const won = m.result === 'win', tie = m.result === 'tie';
                    const clr = tie ? C.soft : won ? C.live : C.danger;
                    const lbl = tie ? 'Tie' : won ? 'Won' : 'Lost';
                    return (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12.5 }}>
                        <span style={{ flex: 'none', width: 34, fontWeight: 800, color: clr }}>{lbl}</span>
                        <span style={{ flex: 'none', color: C.muted }}>vs</span>
                        <span style={{ flex: 'none', fontWeight: 700, color: C.ink, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.vs}</span>
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: C.soft }}>{qtitle(m.quizId)}</span>
                        {m.my != null && m.their != null ? <span style={{ flex: 'none', fontWeight: 700, color: C.soft, fontVariantNumeric: 'tabular-nums' }}>{m.my}-{m.their}</span> : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={card}>
        <div style={hd}>Alert Settings</div>
        <label onClick={toggleMuteAll} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', padding: '4px 0' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Mute all duel alerts</span>
          <span style={{ width: 44, height: 26, borderRadius: 999, background: muteAll ? C.accent : 'var(--stg-surf2,rgba(255,255,255,0.08))', position: 'relative', flex: 'none' }}>
            <span style={{ position: 'absolute', top: 3, left: muteAll ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: ON_ACC }} />
          </span>
        </label>
        <div style={{ fontSize: 12, color: C.soft, marginTop: 4 }}>When on, you won{"'"}t get any duel challenge pop-ups.</div>
        <div style={{ marginTop: 14, fontSize: 12, fontWeight: 800, color: C.soft, textTransform: 'uppercase', letterSpacing: '.04em' }}>Muted Players</div>
        {mutedEntries.length === 0 ? <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>No muted players.</div> : mutedEntries.map(([a, nm]) => (
          <div key={a} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{nm || 'Player'}</span>
            <button onClick={() => unmute(a)} style={{ background: 'transparent', border: `1px solid ${C.accent}`, color: C.accent, borderRadius: 8, padding: '5px 12px', fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Unmute</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatHubClient() {
  const scope = 'all'; // category selector removed; Stat Hub always shows overall + per-category table
  // THE HUB IS A STAGE PAGE AND NOW SAYS SO (owner, 2026-09-01: "stat hub needs
  // to carry light and dark mode too, currently it is dark"). It has carried the
  // .stage-page class and read every --stg-* token since it moved onto the
  // stage, but it never wrote data-stage-theme, so the base block on
  // .stage-page (the dark register) was the only one that could ever apply and
  // the page was pinned dark whatever the reader had chosen. One attribute is
  // the whole fix; the switch beside it is what makes the register reachable
  // from here rather than only from a game page.
  const [stageTheme, setStageTheme] = useStageTheme();

  const [me, setMe] = useState(null);
  const [stats, setStats] = useState([]);     // /api/quiz/stats
  const [totals, setTotals] = useState({ byQuiz: {}, leaders: {}, leaderKeys: {}, total: 0, totalTime: 0 });
  const [shareOpen, setShareOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [board, setBoard] = useState(null); // IQ Points ranking, served top 2000 (incl. anon)
  const [boardTotal, setBoardTotal] = useState(0); // real player count; board itself is capped
  // Duel data lives at page level so the Duels nav tile can show the live
  // record, streak, and waiting-on-you badge before the tab is ever opened.
  const [duels, setDuels] = useState({ yourMove: [], awaiting: [], completed: [] });
  const [duelLadder, setDuelLadder] = useState([]);
  const [duelsLoaded, setDuelsLoaded] = useState(false);
  useEffect(() => {
    const anon = getAnonId();
    if (anon) fetch(`/api/duel/list?anonId=${encodeURIComponent(anon)}${getEmail() ? `&email=${encodeURIComponent(getEmail())}` : ''}`).then((r) => r.json()).then((d) => { if (d) setDuels({ yourMove: d.yourMove || [], awaiting: d.awaiting || [], completed: d.completed || [] }); }).catch(() => {}).finally(() => setDuelsLoaded(true));
    else setDuelsLoaded(true);
    fetch('/api/duel/ladder').then((r) => r.json()).then((d) => { if (d && Array.isArray(d.ladder)) setDuelLadder(d.ladder); }).catch(() => {});
  }, []);
  const myDuel = useMemo(() => { const a = getAnonId(); return duelLadder.find((p) => p.anon === a) || null; }, [duelLadder]);
  const myDuelStreak = useMemo(() => duelStreakOf(myDuel && myDuel.matches), [myDuel]);

  // Today's combined daily board lives at page level so the Daily Puzzles nav tile
  // can show a live number (my standing, or the field size) before the tab opens.
  const [referrals, setReferrals] = useState(null);
  // The cap prints today's date, and it is read in an EFFECT rather than during
  // render: the server has no idea what today is in the reader's zone, so
  // computing it during render makes the first client paint disagree.
  const [capDate, setCapDate] = useState('');
  useEffect(() => {
    try { setCapDate(new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })); } catch (e) {}
    fetch('/api/quiz/referrals').then((r) => r.json()).then((d) => { if (d) setReferrals(d); }).catch(() => setReferrals({ top: [] }));
  }, []);

  const [dailyToday, setDailyToday] = useState(null);
  useEffect(() => {
    const qs = new URLSearchParams();
    const a = getAnonId(); if (a) qs.set('anonId', a);
    const em = getEmail(); if (em) qs.set('email', em);
    fetch('/api/quiz/daily-combined?' + qs.toString()).then((r) => r.json()).then((d) => { if (d && Array.isArray(d.overall)) setDailyToday(d); }).catch(() => {});
  }, []);

  const staticCatalog = useMemo(() => (QUIZZES || []).filter((q) => q && q.id).map((q) => ({
    id: q.id, title: q.navTitle || cleanTitle(q.title) || q.id, dept: deptOf(q),
  })), []);
  // Daily puzzles publish a fresh dated instance ('<key>-M-D-YY') each day. Those
  // days were hand-seeded into QUIZZES, and every game's seed eventually ran out
  // (crux stopped at 8/2/26, links at 7/25, and 15 games were never seeded at all).
  // Because this table joins FROM the catalog, a day past its cutoff vanished from
  // All Quizzes even though its plays were in /api/quiz/stats the whole time. So
  // derive any dated daily the catalog is missing from the stats payload instead:
  // each day keeps its own row, and the bank can never expire again.
  const catalog = useMemo(() => {
    const seen = new Set(staticCatalog.map((q) => q.id));
    const extra = [];
    for (const s of stats) {
      const id = s && s.quizId;
      if (!id || seen.has(id) || !DAILY_DATED_RE.test(id)) continue;
      seen.add(id);
      extra.push({ id, title: dailyLabel(id) || id, dept: dailyDept(id) });
    }
    return extra.length ? staticCatalog.concat(extra) : staticCatalog;
  }, [staticCatalog, stats]);
  const titleById = useMemo(() => Object.fromEntries(catalog.map((q) => [q.id, q.title])), [catalog]);

  const cats = useMemo(() => {
    const byDept = new Map();
    for (const q of catalog) { if (!byDept.has(q.dept)) byDept.set(q.dept, []); byDept.get(q.dept).push(q); }
    const list = [];
    for (const { id } of DEPT_NAV) if (byDept.has(id)) list.push(id);
    for (const k of byDept.keys()) if (!list.includes(k)) list.push(k);
    return list.map((key) => ({ key, label: DEPT_LABEL[key] || 'Quiz', c: (DEPT_COLOR[key] || DEPT_COLOR.misc).c, count: byDept.get(key).length }))
      .sort((a, b) => b.count - a.count);
  }, [catalog]);
  const byKey = useMemo(() => Object.fromEntries(cats.map((c) => [c.key, c])), [cats]);

  // Current player's identity, used to highlight their row in the User Base board.
  const myAnonKey = useMemo(() => { const a = getAnonId(); return a ? `a:${a}` : null; }, []);
  const myName = useMemo(() => { const id = getIdentity(); return (id && id.username) || null; }, []);

  // ── data loads ──
  useEffect(() => {
    const ident = getIdentity();
    const anonId = getAnonId();
    const email = ident && ident.email ? ident.email : '';
    if (anonId || email) {
      const params = new URLSearchParams();
      if (anonId) params.set('anonId', anonId);
      if (email) params.set('email', email);
      fetch(`/api/quiz/me?${params.toString()}`).then((r) => r.json()).then((d) => { if (d) setMe(d); }).catch(() => {});
    } else {
      setMe({ found: false });
    }
    fetch('/api/quiz/stats').then((r) => r.json()).then((d) => { if (d && Array.isArray(d.quizzes)) setStats(d.quizzes); }).catch(() => {});
    fetch('/api/quiz/totals').then((r) => r.json()).then((d) => { if (d && !d.error) setTotals({ byQuiz: d.byQuiz || {}, leaders: d.leaders || {}, leaderKeys: d.leaderKeys || {}, total: d.total || 0, totalTime: d.totalTime || 0 }); }).catch(() => {});
    fetch('/api/quiz/xp?full=1').then((r) => r.json()).then((d) => { if (d && Array.isArray(d.players)) { setBoard(d.players); setBoardTotal(d.total || d.players.length); } }).catch(() => {});
  }, []);

  // Inline player viewing: clicking a player in the ranking loads their full
  // profile in place (no page nav). null = my own stats.
  const [viewKey, setViewKey] = useState(null);
  // /quizzes/hub?tab=daily&game=<key> preselects that game's daily board.
  const [dailyGame, setDailyGame] = useState(null);
  const [viewProfile, setViewProfile] = useState(null);
  useEffect(() => {
    if (!viewKey) { setViewProfile(null); return; }
    setViewProfile(null);
    let on = true;
    fetch(`/api/quiz/player?key=${encodeURIComponent(viewKey)}`).then((r) => r.json()).then((d) => { if (on) setViewProfile(d || { found: false }); }).catch(() => { if (on) setViewProfile({ found: false }); });
    return () => { on = false; };
  }, [viewKey]);
  // Deep link: /quizzes/hub?player=<key> opens that player's profile on load.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const pk = sp.get('player');
    if (pk) setViewKey(pk);
    const dg = sp.get('game');
    if (dg) setDailyGame(dg);
    // ?tab= and ?pview= were the old two-level navigation. Every one of those
    // targets is a SECTION now, so an old link scrolls to it instead of 404ing
    // its own state. Kept because they are linked from the home and from mail.
    const tb = sp.get('tab');
    const pv0 = sp.get('pview');
    const TAB_SECTION = { player: 'standing', daily: 'today', quizzes: 'quizzes', duels: 'duels' };
    const PVIEW_SECTION = { ranking: 'standing', trophies: 'trophies', rating: 'level', activity: 'activity', category: 'quizzes' };
    const target = PVIEW_SECTION[pv0] || TAB_SECTION[tb];
    if (target) setTimeout(() => { const el = document.getElementById(target); if (el) el.scrollIntoView({ block: 'start' }); }, 300);
    // Deep link to a sub-view of the Player tab, so a caller can land on the
    // thing its own label promised: /quizzes/hub?tab=player&pview=category is
    // where the home page's "Category mastery" link goes.
    // Deep link to a section within a tab (e.g. the daily-games Hall of Fame):
    // /quizzes/hub?tab=daily&section=champions scrolls the champion history in.
    // The daily leaderboard above it loads and grows after mount, so re-align a
    // few times until the section settles near the top instead of scrolling once.
    if (tb === 'daily' && sp.get('section') === 'champions') {
      let n = 0, stable = 0;
      const tick = () => {
        const el = document.getElementById('daily-champions');
        if (el) {
          el.scrollIntoView({ block: 'start' });
          if (Math.abs(el.getBoundingClientRect().top) < 44) { if (++stable >= 3) return; } else stable = 0;
        }
        if (n++ < 22) setTimeout(tick, 180);
      };
      setTimeout(tick, 220);
    }
  }, []);
  // Opening a player from any board: your own name collapses back to your
  // stats; a REGISTERED player navigates to their public /player/<name> page;
  // a guest (no public URL) opens in place, as before.
  const openPlayer = (k) => {
    const mine = (me && me.userKey && k === me.userKey) || (myAnonKey && k === myAnonKey);
    if (mine) { setViewKey(null); return; }
    const row = board && board.find((p) => p.userKey === k);
    if (row && !row.isAnon && row.name) { window.location.href = `/player/${encodeURIComponent(row.name)}`; return; }
    setViewKey(k);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const viewing = !!viewKey;
  const profile = viewing ? viewProfile : me;
  const found = profile && profile.found;
  const statBarMe = profile == null ? undefined : (profile.found ? { ...profile, signed: !profile.isAnon } : { found: false });
  const bestCat = useMemo(() => {
    const bc = profile && profile.byCategory;
    if (!bc) return null;
    // Best category = where the player ranks highest on COMPLETED; ties break to
    // IQ Points rank in that category, then to played rank.
    let best = null;
    for (const k of Object.keys(bc)) {
      const c = bc[k];
      if (!c || !(c.matches > 0)) continue;
      const cand = { key: k, rank: c.completedRank ?? c.rank, catTotal: c.catTotal,
        cR: c.completedRank ?? Infinity, sR: c.rank ?? Infinity, pR: c.playedRank ?? Infinity };
      if (!best || cand.cR < best.cR
          || (cand.cR === best.cR && cand.sR < best.sR)
          || (cand.cR === best.cR && cand.sR === best.sR && cand.pR < best.pR)) best = cand;
    }
    return best;
  }, [profile]);
  const tierLabel = profile && profile.tier ? profile.tier : 'Unrated';
  const tierBg = profile && profile.tierBg ? profile.tierBg : T.paper;
  const tierFg = profile && profile.tierFg ? profile.tierFg : C.muted;

  const statsById = useMemo(() => Object.fromEntries(stats.map((s) => [s.quizId, s])), [stats]);
  const totalPlays = useMemo(() => stats.reduce((a, s) => a + (s.plays || 0), 0), [stats]);

  const playerBarRef = useRef(null);
  const bestCatRef = useRef(null);
  useEffect(() => {
    const bar = playerBarRef.current;
    if (!bar) return;
    let lastW = -1;
    const evaluate = () => {
      const w = bar.clientWidth;
      if (w === lastW) return;
      lastW = w;
      const el = bestCatRef.current;
      if (el) el.style.display = '';
      const maxRows = w <= 560 ? 2 : 1;
      // Count visual rows by each child's vertical CENTER: with align-items:center
      // all items on one flex line share a center, so this is robust to the
      // differing item heights that make raw offsetTop read as multiple rows.
      const rows = [];
      for (const child of bar.children) {
        if (child.offsetWidth === 0 && child.offsetHeight === 0) continue;
        const cen = child.offsetTop + child.offsetHeight / 2;
        if (!rows.some((x) => Math.abs(x - cen) <= 6)) rows.push(cen);
      }
      if (el) el.style.display = rows.length > maxRows ? 'none' : '';
      bar.classList.toggle('hub-bleed', rows.length === 1 && w > 560);
    };
    const ro = new ResizeObserver(evaluate);
    ro.observe(bar);
    evaluate();
    return () => ro.disconnect();
  }, [bestCat, profile, found]);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
    .qzhub{font-family:${FONT};color:${C.ink};}
    .qzhub .lbl{font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};}
    .qzhub .card{background:${C.surface};border:1px solid ${C.line};border-radius:12px;overflow:hidden;min-width:0;}
    .qzhub .metric{background:${C.bg};border-radius:10px;padding:12px 14px;}
    .qzhub .metric .v{font-size:21px;font-weight:700;}
    .qzhub .rankchip{font-size:10px;font-weight:700;color:${C.accent};background:${C.accsoft};border-radius:5px;padding:1px 6px;letter-spacing:0;text-transform:none;margin-left:6px;}
    .qzhub .pvbtn{border:none;background:transparent;border-radius:6px;padding:5px 11px;font:inherit;font-family:${FONT};font-size:12px;color:${C.muted};cursor:pointer;}
    .qzhub .pvbtn.on{background:${C.surface};color:${C.ink};font-weight:700;}
    .qzhub .dd{position:relative;}
    .qzhub .ddbtn{display:flex;align-items:center;gap:8px;background:${C.surface};border:1px solid ${C.line};border-radius:10px;padding:9px 12px;cursor:pointer;font:inherit;min-width:200px;}
    .qzhub .ddmenu{position:absolute;top:calc(100% + 6px);right:0;z-index:30;background:${C.surface};border:1px solid ${C.line};border-radius:10px;box-shadow:0 8px 24px rgba(11,15,26,0.28);padding:6px;min-width:430px;display:grid;grid-template-columns:1fr 1fr;gap:1px 4px;}
    .qzhub .ddmenu .ddall{grid-column:1 / -1;}
    .qzhub .dditem{display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:7px;cursor:pointer;font-size:13px;}
    .qzhub .dditem:hover{background:${C.bg};}
    .qzhub .dot{width:9px;height:9px;border-radius:3px;flex:none;}
    .qzhub .tabs{display:flex;gap:4px;background:transparent;padding:0;margin:18px 0 16px;border-bottom:1px solid ${C.line};}
    .qzhub .tab{border:1px solid transparent;background:transparent;border-radius:10px 10px 0 0;padding:11px 20px;margin-bottom:-1px;font:inherit;font-family:${FONT};font-size:13.5px;font-weight:600;color:${C.muted};cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;}
    .qzhub .tabcue{display:none;}
    @media(max-width:680px){.qzhub .tabs{gap:2px;}.qzhub .tab{flex:1;font-size:12px;padding:10px 6px;gap:5px;}}
    .qzhub .tab.on{background:${C.surface};color:${C.ink};font-weight:700;border-color:${C.line};border-bottom-color:${C.surface};}
    .qzhub .tab.on svg{color:${C.accent};}
    .qzhub .hrow{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid ${C.line};font-size:13px;}
    .qzhub .score{font-weight:700;color:${C.accent};font-variant-numeric:tabular-nums;}
    .qzhub table{width:100%;border-collapse:collapse;font-size:12.5px;}
    .qzhub th{text-align:left;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};padding:8px 10px;border-bottom:1px solid ${C.line};}
    .qzhub td{padding:8px 10px;border-bottom:1px solid ${C.line};}
    .qzhub .gtag{font-size:8.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${C.soft};border:1px solid ${C.line};border-radius:4px;padding:1px 4px;}
    .qzhub .formula{background:${C.bg};border:1px solid ${C.line};border-radius:10px;padding:14px 16px;font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.9;}
    .qzhub .back{display:inline-flex;align-items:center;gap:6px;color:${C.muted};text-decoration:none;font-size:13px;}
    .qzhub .back:hover{color:${C.ink};}
    .qzhub .crumb1{font-size:18px;font-weight:800;letter-spacing:-0.02em;}
    .qzhub .crumb2{font-size:18px;font-weight:600;color:${C.accent};}
    .qzhub a.qlink{text-decoration:none;color:inherit;}
.qzhub .metric-lbl{display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:nowrap;}
    @media(max-width:600px){.qzhub .metric-lbl{flex-wrap:wrap;}}
    @media(max-width:680px){.qzhub .rgrid{grid-template-columns:1fr !important;}}
    @media(max-width:560px){.qzhub .shpbar{gap:8px 12px !important;padding:13px 14px !important;}.qzhub .shpbar-id{order:1;}.qzhub .shpbar-share{order:2;margin-left:auto !important;width:auto !important;padding:8px 13px !important;}.qzhub .shpbar-iddiv,.qzhub .shpbar-maindiv{display:none !important;}.qzhub .shpbar-main{order:3;flex-basis:100% !important;width:100% !important;gap:14px !important;}.qzhub .shpbar-main > div:nth-child(3){gap:14px !important;}.qzhub .sh-mext{display:none !important;}.qzhub .sh-rank{font-size:30px !important;}}
    .qzhub .lbl2{font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};}
    .qzhub .hubbtn{display:flex;align-items:center;gap:7px;background:${C.surface};color:${C.accent};border:1px solid ${C.line};border-right:3px solid ${C.accent};padding:10px 15px;border-radius:10px;font-family:${FONT};font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap;}
    .qzhub .qz-playerbar.hub-bleed .hubbtn{align-self:stretch;padding:0 18px;margin:-11px -14px -11px 0;border-radius:0 11px 11px 0;border-top:none;border-bottom:none;border-left:none;}
    .qzhub .hubbtn:hover{background:${C.accsoft};}
    .qzhub .qz-srank{font-size:11px;font-weight:600;color:${C.soft};}
    .qzhub .qz-pname{max-width:160px;}
    @media(max-width:560px){.qzhub .qz-pname{max-width:120px;}}
    @media(max-width:560px){.qzhub .qz-srank{display:none !important;}}
    .qz-playerbar .qz-skill-empty{display:none !important;}
    @media(max-width:560px){.qz-playerbar{flex-wrap:wrap !important;align-items:center !important;gap:10px 14px !important;}.qz-playerbar .qz-div{display:none !important;}.qz-playerbar .qz-stats{order:9 !important;flex:1 1 100% !important;margin-left:0 !important;justify-content:space-between !important;gap:10px !important;}.qz-playerbar .qz-bestcat{order:3 !important;}.qz-playerbar .hubbtn{order:4 !important;margin-left:auto !important;flex:0 0 auto !important;}}
    @media(max-width:560px){.qzhub{padding-left:14px !important;padding-right:14px !important;}}
    .qzhub .fdot{width:9px;height:9px;border-radius:50%;display:inline-block;}
    .qzhub .duelpulse{animation:qzpulse 2s ease-in-out infinite;}
    .qzhub .flameon{animation:qzflame 1.4s ease-in-out infinite;}
    @keyframes qzpulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb, var(--stg-acc,#7dd3fc) 45%, transparent);}50%{box-shadow:0 0 0 7px transparent;}}
    @keyframes qzflame{0%,100%{transform:scale(1);}50%{transform:scale(1.16);}}
    @media (prefers-reduced-motion: reduce){.qzhub .duelpulse,.qzhub .flameon{animation:none;}}
    @media(max-width:640px){.qzhub .lbar{display:none;}.qzhub .lform{display:none;}.qzhub .duelqt{display:none;}}
    .qzhub .tiles{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:18px 0 14px;}
    @media(max-width:900px){.qzhub .tiles{grid-template-columns:repeat(3,1fr);}}
    @media(max-width:680px){.qzhub .tiles{grid-template-columns:1fr 1fr;gap:8px;}}
    .qzhub .tile{position:relative;text-align:left;background:${C.surface};border:1px solid ${C.line};border-radius:12px;padding:12px 14px;font-family:${FONT};cursor:pointer;min-width:0;transition:border-color .12s;}
    .qzhub .tile:hover{border-color:${C.accent};}
    .qzhub .tile.on{background:${C.accent};border-color:${C.accent};color:${ON_ACC};}
    .qzhub .tilebadge{position:absolute;top:9px;right:11px;background:${C.danger};color:${ON_ACC};font-size:10px;font-weight:800;border-radius:999px;padding:2px 7px;}
    .qzhub .pill{display:inline-flex;align-items:center;gap:6px;background:${C.surface};border:1px solid ${C.line};color:${C.muted};border-radius:999px;padding:7px 15px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:${FONT};}
    .qzhub .pill:hover{border-color:${C.accent};}
    .qzhub .pill.on{background:${C.accent};border-color:${C.accent};color:${ON_ACC};font-weight:800;}

    /* THE MEDAL PALETTE, ONE TRIPLE PER REGISTER. The dark values are the
       three literals this file used to carry; the light ones are picked
       against a pale ground rather than converted from them, exactly as the
       stage's own token blocks are. Ink clears 4.5:1 on white (5.3 / 5.9 /
       6.5) and the 3px rule clears 3:1 on the light ground (3.4 / 3.3 / 4.5),
       because a rank rule is a boundary and owes 1.4.11 rather than 1.4.3.
       NOTE the unquoted attribute value: a single quote inside a JSX
       <style>{...}</style> is escaped to an entity and takes the whole
       selector with it, so [data-stage-theme=light] is written bare. */
    .qzhub-stage{--hm1:#e8b43a;--hm2:#b8bcc4;--hm3:#c8814b;
      --hmi1:#e8b43a;--hmi2:#c9ced6;--hmi3:#d79a6a;
      --hmb1:rgba(232,180,58,0.16);--hmb2:rgba(255,255,255,0.10);--hmb3:rgba(200,129,75,0.18);}
    .qzhub-stage[data-stage-theme=light]{--hm1:#a97b12;--hm2:#7d8798;--hm3:#a1622f;
      --hmi1:#8a6508;--hmi2:#5b6472;--hmi3:#8a4f22;
      --hmb1:rgba(232,180,58,0.30);--hmb2:rgba(11,15,26,0.09);--hmb3:rgba(200,129,75,0.26);}

    /* ── the stage chrome ───────────────────────────────────────────────── */
    /* position:relative because ThemePop is an absolutely positioned child of
       whichever cap is on the page and measures itself against this one. */
    .hubcap{position:relative;display:flex;align-items:center;gap:18px;flex-wrap:wrap;max-width:1180px;margin:0 auto;padding:15px 38px 14px;font-family:${FONT};}
    .hubcap-mark{display:flex;align-items:center;gap:9px;flex:none;text-decoration:none;color:${C.ink};}
    .hubcap-mark b{font-size:15.5px;font-weight:800;letter-spacing:-.2px;}
    .hubcap-mark b i{font-style:normal;color:${C.accent};}
    .hubcap-eyebrow{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.soft};}
    .hubcap-figs{display:flex;gap:26px;margin-left:auto;flex-wrap:wrap;}
    .hubfig{text-align:right;line-height:1.15;}
    .hubfig b{display:block;font-size:15px;font-weight:800;white-space:nowrap;color:${C.ink};font-variant-numeric:tabular-nums;}
    .hubfig span{display:block;margin-top:3px;font-size:9.5px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:${C.soft};}
    .hubfig .of{font-size:11.5px;font-weight:700;color:${C.muted};}
    .hubcap-btns{display:flex;gap:8px;flex:none;}
    .hubchip{display:inline-flex;align-items:center;gap:6px;border:1px solid ${C.line};background:none;color:${C.ink};border-radius:999px;padding:7px 14px;font:inherit;font-family:${FONT};font-size:11.5px;font-weight:700;cursor:pointer;text-decoration:none;}
    .hubchip:hover{background:${C.surface};}
    .hub-tg{padding:7px 10px;}
    .hubjump{position:sticky;top:0;z-index:40;background:${C.bg};border-bottom:1px solid ${C.line};}
    .hubjump-in{max-width:1180px;margin:0 auto;padding:9px 38px;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;}
    .hubjump-in::-webkit-scrollbar{display:none;}
    .hubjump a{flex:none;text-decoration:none;color:${C.muted};font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;padding:6px 11px;border-radius:999px;font-family:${FONT};}
    .hubjump a:hover{color:${C.ink};background:${C.surface};}
    .hubsec{padding:30px 0 6px;border-top:1px solid ${C.line};scroll-margin-top:56px;}
    .hubsec:first-of-type{border-top:0;}
    .hubsec-head{display:flex;align-items:baseline;gap:13px;flex-wrap:wrap;margin-bottom:14px;}
    .hubsec-head h2{margin:0;font-size:13px;font-weight:800;letter-spacing:.065em;text-transform:uppercase;color:${C.ink};}
    .hubsec-sub{font-size:12px;font-weight:700;color:${C.muted};}
    .hubsec-right{margin-left:auto;}
    .hubmore{font-size:11.5px;font-weight:700;color:${C.soft};text-decoration:none;}
    a.hubmore:hover{color:${C.accent};}
    .hublab{font-size:9.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:${C.soft};margin-bottom:8px;}
    .hubnote{font-size:11.5px;line-height:1.6;color:${C.soft};margin:12px 0 0;max-width:76ch;}
    .hubempty{font-size:13px;color:${C.muted};padding:10px 0;}
    .hubshare{display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap;}
    .hublink{display:inline-block;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;font-weight:600;color:${C.ink};background:${C.surface};border:1px solid ${C.line};padding:9px 13px;border-radius:7px;}
    .hubbar{display:block;height:9px;border-radius:2px;background:${C.accsoft};overflow:hidden;}
    .hubbar span{display:block;height:100%;border-radius:2px;}
    .hubyou{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:${C.accent};margin-left:7px;}
    @media(max-width:900px){.hubcap-figs{gap:18px;width:100%;margin-left:0;}}
    @media(max-width:560px){.hubcap,.hubjump-in{padding-left:14px;padding-right:14px;}.hubcap-figs{gap:14px 20px;}.hubfig b{font-size:13.5px;}}
  `;

  return (
    <div className="stage-page qzhub-stage" data-stage-theme={stageTheme} style={{ '--stg-acc-dk': '#7dd3fc', '--stg-acc-lt': '#0369a1', '--stg-acc-ink-lt': '#0369a1', background: C.bg, minHeight: '100vh', position: 'relative' }}>
      <style>{css}</style>
      <header className="hubcap">
        <Link href="/" className="hubcap-mark" aria-label="Mind Loft home"><Logo size={17} /> <b>Mind <i>Loft</i></b></Link>
        <span className="hubcap-eyebrow">Stat Hub{capDate ? ` · ${capDate}` : ''}</span>
        <div className="hubcap-figs">
          {found && profile.name ? <span className="hubfig"><b>{profile.name}</b><span>Player</span></span> : null}
          {found && profile.rank ? <span className="hubfig"><b>#{profile.rank} <span className="of">of {((me && me.totalPlayers) || 0).toLocaleString()}</span></b><span>Rank</span></span> : null}
          {found ? <span className="hubfig"><b>{(profile.xp || 0).toLocaleString()}</b><span>IQ points</span></span> : null}
          {dailyToday && dailyToday.me ? <span className="hubfig"><b>#{dailyToday.me.rank}</b><span>Today</span></span> : null}
        </div>
        <div className="hubcap-btns">
          {found && !viewing ? <button className="hubchip" onClick={() => setShareOpen(true)}><Share2 size={13} /> Share</button> : null}
          {/* The fourth cap to draw the light switch, after StageChrome, the
              home and the circuit frame. Its class is registered in the SWITCH
              selector in app/ThemePop.jsx so the bubble below can find it. */}
          <button
            type="button"
            className="hubchip hub-tg"
            onClick={() => setStageTheme(stageTheme === 'light' ? 'dark' : 'light')}
            aria-label={stageTheme === 'light' ? 'Switch to dark' : 'Switch to light'}
            title={stageTheme === 'light' ? 'Switch to dark' : 'Switch to light'}
          >
            {stageTheme === 'light' ? (
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
              </svg>
            )}
          </button>
          <Link className="hubchip" href="/">Today →</Link>
        </div>
        {/* The pointer at that switch, first visit only. LAST CHILD of the cap,
            because it reads its own parent to find the glyph and measure
            against it. */}
        <ThemePop />
      </header>
      <nav className="hubjump" aria-label="Sections"><div className="hubjump-in">
        {SECTIONS.map((x) => <a key={x.id} href={`#${x.id}`}>{x.label}</a>)}
      </div></nav>
      <div className="qzhub qzf-w" style={{ maxWidth: 1180, margin: '0 auto', padding: '4px 38px 70px', position: 'relative' }}>

        {viewing ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: C.accsoft, border: `1px solid ${C.line}`, borderRadius: 10, padding: '8px 14px', marginTop: 10 }}>
            <span style={{ fontSize: 13, color: C.ink }}>Viewing <b>{(viewProfile && viewProfile.name) || 'player'}</b>{"'"}s stats</span>
            <button onClick={() => { setViewKey(null); if (typeof window !== 'undefined' && window.history) window.history.replaceState(null, '', '/quizzes/hub'); }} style={{ border: `1px solid ${T.accentBorder}`, background: RAISE, color: C.accent, borderRadius: 7, padding: '6px 13px', font: 'inherit', fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Back to my stats</button>
          </div>
        ) : null}

        {!viewing && me && !(me.found && !me.isAnon) ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', background: C.accsoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: '14px 18px', marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: C.accent, color: ON_ACC, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><UserPlus size={20} /></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, lineHeight: 1.2 }}>You{"'"}re playing as a guest</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45, marginTop: 2 }}>Add a display name (email optional) to put your scores on the leaderboards and keep your stats across devices. No password needed.</div>
              </div>
            </div>
            <button onClick={() => setSignupOpen(true)} style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, background: C.accent, color: ON_ACC, border: 'none', borderRadius: 10, padding: '11px 18px', fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}><UserPlus size={15} /> Create name</button>
          </div>
        ) : null}

        <Section id="standing" title="Standing" sub={found ? `Level ${profile.level || 1} · ${(profile.xp || 0).toLocaleString()} IQ points` : 'Play to get ranked'} right={!viewing && myName ? <Link href={`/player/${encodeURIComponent(myName)}`} className="hubmore">Public profile →</Link> : null}>
          <UserBaseBody board={board} boardTotal={boardTotal} myName={myName} myAnonKey={myAnonKey} onSelectPlayer={openPlayer} viewKey={viewKey} />
        </Section>

        <Section id="today" title="Today" sub={dailyToday && dailyToday.me ? `#${dailyToday.me.rank} · ${fmtPts1(dailyToday.me.total)} of ${dailyToday.maxTotal} points` : (dailyToday ? `${dailyToday.gameCount} puzzles live` : null)}>
          <DailyGamesView initialGame={dailyGame} onSelectPlayer={openPlayer} />
        </Section>

        <Section id="quizzes" title="Quizzes" sub={found ? `${(profile.activity && profile.activity.played || 0).toLocaleString()} of ${catalog.length.toLocaleString()} played` : `${catalog.length.toLocaleString()} on the site`}>
          <QuizzesPanel me={profile} myProfile={me} scope={scope} byKey={byKey} catalog={catalog} stats={statsById} totals={totals} totalPlays={totalPlays} onSelectPlayer={openPlayer} />
        </Section>

        <Section id="trophies" title="Trophies" sub={found && profile.trophies && profile.trophies.total ? `${profile.trophies.earnedCount || 0} of ${profile.trophies.total} unlocked` : null}>
          <TrophyCase trophies={found ? profile.trophies : null} viewing={viewing} stage />
        </Section>

        <Section id="level" title="IQ and level">
          <XpPanel me={profile} titleById={titleById} viewing={viewing} stage />
        </Section>

        <Section id="activity" title="Activity">
          <ActivityFeed recent={found ? profile.recent : []} titleById={titleById} viewing={viewing} stage />
        </Section>

        {!viewing ? (
          <Section id="duels" title="Duels" sub={myDuel ? `${myDuel.wins}-${myDuel.losses}${myDuel.ties ? `-${myDuel.ties}` : ''}` : 'No duels yet'}>
            <DuelsPanel data={duels} setData={setDuels} ladder={duelLadder} loaded={duelsLoaded} onSelectPlayer={openPlayer} />
          </Section>
        ) : null}

        {!viewing ? (
          <Section id="community" title="Community" sub={referrals && referrals.me ? `${referrals.me.credits} brought in` : null} right={<span className="hubmore">Rolling {(referrals && referrals.days) || 90} days</span>}>
            <CommunityPanel data={referrals} />
          </Section>
        ) : null}
      </div>

      {shareOpen && found && <ShareStatsModal profile={profile} byKey={byKey} onClose={() => setShareOpen(false)} />}
      {signupOpen && <SignupModal onClose={() => setSignupOpen(false)} />}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, flexWrap: 'wrap', margin: '30px 0 8px', fontSize: 12.5, color: C.muted, fontFamily: FONT }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={14} strokeWidth={2.75} style={{ color: 'var(--stg-good,#6ee7b7)' }} /> Played</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Star size={14} strokeWidth={1.5} fill={T.gold} color={T.goldInk} /> Completed (100%)</span>
      </div>
    </div>
  );
}

// ─── small helpers ──────────────────────────────────────────────────────────
// A compact metric for the profile header: label, value, and a "#rank" chip.


// Columns for the Category Detail table. `get(c, cr)` extracts the sort value
// from a category row's stats record (cr); `chip` names the per-category rank
// field on cr that renders as a #rank badge in that column.


// Share of a quiz pool a player has aced (completed / pool size). Used in the
// Category table's Completed column, scoped per-category (overall row uses the
// whole catalog, each category row uses that category's quiz count).


// ─── Daily Puzzles view ───────────────────────────────────────────────────────
// Global (not player-scoped): the combined daily leaderboard, the day-by-day
// champion history, and an all-time stat line for each daily puzzle. Winner history
// and per-game aggregates come from /api/quiz/daily-history; today's per-game
// leaders come from /api/quiz/daily-combined (the same source the board uses).
const DAILY_GAME_META = Object.fromEntries(
  DAILY_GAMES.map((g) => [g.key, { name: g.name, c: g.color, href: g.href, tag: g.tag }])
);

function fmtPts1(n) {
  const v = Math.round(Number(n) * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function DailyGamesView({ onSelectPlayer, initialGame = null }) {
  const [hist, setHist] = useState(null);   // /api/quiz/daily-history
  const [today, setToday] = useState(null); // /api/quiz/daily-combined (today's per-game boards)
  useEffect(() => {
    let alive = true;
    fetch('/api/quiz/daily-history')
      .then((r) => r.json()).then((d) => { if (alive) setHist(d || {}); })
      .catch(() => { if (alive) setHist({}); });
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    const qs = new URLSearchParams();
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    fetch('/api/quiz/daily-combined?' + qs.toString())
      .then((r) => r.json()).then((d) => { if (alive) setToday(d || {}); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const history = (hist && hist.history) || [];
  const champions = (hist && hist.champions) || [];
  const games = (hist && hist.games) || [];
  const topChamp = champions[0] || null;
  const todayGames = useMemo(() => {
    const map = {};
    for (const g of ((today && today.games) || [])) map[g.key] = g;
    return map;
  }, [today]);

  const openPlayer = (key) => { if (key && onSelectPlayer) onSelectPlayer(key); };
  const col = '68px 1fr 76px 60px 52px';
  const sub = { fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted };
  const nameBtn = (key, name, size) => (key
    ? <button onClick={() => openPlayer(key)} style={{ border: 'none', background: 'transparent', padding: 0, font: 'inherit', fontFamily: FONT, fontWeight: 700, fontSize: size, color: C.accent, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{name}</button>
    : <span style={{ fontWeight: 700, fontSize: size, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>);

  return (
    <div>
      {/* 1. The combined daily leaderboard (full board + per-game tabs). */}
      {/* `stage`, not `light`: the hub moved to the stage and the light board is
          the pre-stage white card, which painted a white rectangle on a near-black
          page (and painted it first, which read as the page pre-firing an old
          leaderboard). /daily is still light and still passes `light`. */}
      <DailyCombinedLeaderboard stage allTimeToggle initialTab={initialGame} key={initialGame || 'overall'} />

      {/* 2. Day-by-day champion history. */}
      <div id="daily-champions" className="card" style={{ padding: '16px 18px', marginTop: 16, scrollMarginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}><Crown size={17} style={{ color: T.goldInk }} /> Daily Champions</span>
          {hist == null ? null : <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{history.length} {history.length === 1 ? 'day' : 'days'} crowned</span>}
        </div>
        {topChamp && topChamp.wins > 1 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'rgba(232,180,58,0.10)', border: '1.5px solid rgba(232,180,58,0.42)', borderRadius: 12, padding: '11px 14px', marginBottom: 12 }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(232,180,58,0.16)', color: GOLD_INK, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Crown size={17} /></span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}><span style={{ color: GOLD_INK }}>Most crowns:</span> {nameBtn(topChamp.userKey, topChamp.username, 13)}</span>
              <span style={{ display: 'block', fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 1 }}>{topChamp.wins} daily wins across the last {history.length} days</span>
            </span>
          </div>
        ) : null}
        {hist == null ? (
          <div style={{ color: C.soft, fontSize: 13 }}>Loading champion history…</div>
        ) : history.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13 }}>No completed days yet. The first champion is crowned once today wraps up.</div>
        ) : (
          <div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ minWidth: 480 }}>
            <div style={{ display: 'grid', gridTemplateColumns: col, gap: 8, padding: '0 4px 8px', ...sub }}>
              <span>Day</span><span>Champion</span><span style={{ textAlign: 'right' }}>Total</span><span style={{ textAlign: 'right' }}>Puzzles</span><span style={{ textAlign: 'right' }}>Field</span>
            </div>
            {history.map((h, i) => (
              <div key={h.date} style={{ display: 'grid', gridTemplateColumns: col, gap: 8, alignItems: 'center', padding: '9px 4px', borderTop: `1px solid ${C.line}` }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{h.label}</span>
                <span style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                  {i === 0 ? <Crown size={13} style={{ color: T.goldInk, flex: 'none' }} /> : null}
                  {nameBtn(h.winner.userKey, h.winner.username, 13.5)}
                </span>
                <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 800, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>{fmtPts1(h.winner.total)}<span style={{ fontSize: 10.5, fontWeight: 600, color: C.soft }}>/{h.maxTotal}</span></span>
                <span style={{ textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: C.muted, fontVariantNumeric: 'tabular-nums' }}>{h.winner.gamesPlayed}/{h.gameCount}</span>
                <span style={{ textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: C.muted, fontVariantNumeric: 'tabular-nums' }}>{h.field}</span>
              </div>
            ))}
            </div>
            </div>
            <p style={{ fontSize: 11, color: C.soft, marginTop: 11, lineHeight: 1.5 }}>Each day{"'"}s champion is the #1 on that day{"'"}s combined board (best 10 of the day{"'"}s puzzles). Today is still live, so it{"'"}s not crowned yet. Field is the registered players who played any daily puzzle that day.</p>
          </div>
        )}
      </div>

      {/* 3. Individual game stats. */}
      <div className="card" style={{ padding: '16px 18px', marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>Puzzle Stats</span>
          {games.length ? <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>all-time, across {games.length} daily puzzles</span> : null}
        </div>
        {hist == null ? (
          <div style={{ color: C.soft, fontSize: 13 }}>Loading puzzle stats…</div>
        ) : games.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13 }}>No daily-puzzle plays recorded yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(215px,1fr))', gap: 10 }}>
            {games.map((g) => {
              const meta = DAILY_GAME_META[g.key] || { name: g.key, c: C.accent, href: `/${g.key}`, tag: '' };
              const tg = todayGames[g.key];
              const leader = tg && tg.board && tg.board[0];
              const stat = (v, l, clr) => (
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 18, fontWeight: 800, color: clr || C.ink, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
                  <span style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: C.muted }}>{l}</span>
                </span>
              );
              return (
                <div key={g.key} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: '13px 14px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <a href={meta.href} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', minWidth: 0 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: meta.c, flex: 'none' }} />
                      <span style={{ fontSize: 14, fontWeight: 800, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.name}</span>
                    </a>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: C.soft, flex: 'none' }}>{g.days} {g.days === 1 ? 'day' : 'days'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                    {stat(g.plays.toLocaleString(), 'plays', C.accent)}
                    {stat(g.players.toLocaleString(), 'players')}
                    {stat(`${g.avgCompletionPct}%`, 'avg score')}
                  </div>
                  <div style={{ marginTop: 10, paddingTop: 9, borderTop: `1px solid ${C.line}`, fontSize: 11.5, color: C.muted, fontWeight: 600 }}>
                    {leader ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                        <span style={{ color: T.goldInk, flex: 'none', display: 'inline-flex' }}><Crown size={12} /></span>
                        <span style={{ color: C.soft, flex: 'none' }}>Today:</span>
                        {nameBtn(leader.userKey, leader.username, 11.5)}
                      </span>
                    ) : tg ? (
                      <span>Today: {(tg.field || 0).toLocaleString()} on the board</span>
                    ) : (
                      <span>Not live today</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Category view: cards by default, the classic table behind a toggle ─────


// Activity view: play-streak stats + a 12-week heatmap, milestone highlights
// (perfects, personal bests, big IQ Points hauls), then the full game log. All of
// it derives client-side from `recent`, which carries the player's FULL history.


// Full ranking BODY (no card chrome; the card, title, and toggle live in
// PlayerPanel). Podium + chase card on top, then every player registered +
// anonymous in the sortable table, current row highlighted.
const tierNameOf = (lvl) => (lvl >= 18 ? 'Master' : lvl >= 14 ? 'Diamond' : lvl >= 9 ? 'Gold' : lvl >= 5 ? 'Silver' : 'Bronze');
function UserBaseBody({ board, boardTotal, myName, myAnonKey, onSelectPlayer, viewKey }) {
  const [sort, setSort] = useState({ col: 'xp', dir: 'desc' });
  if (!board) return <div style={{ fontSize: 13, color: C.soft, padding: '6px 0' }}>Loading the full ranking…</div>;
  if (!board.length) return <div style={{ fontSize: 13, color: C.soft, padding: '6px 0' }}>No ranked players yet.</div>;
  const isMine = (p) => (myAnonKey && p.userKey === myAnonKey) || (myName && !p.isAnon && p.name === myName);
  const hasTrend = board.some((p) => p.trend7d !== undefined);
  const trendCell = (p) => {
    if (p.trend7d === undefined) return <span style={{ color: C.soft }}>—</span>;
    if (p.trend7d == null) return <span style={{ fontSize: 10.5, fontWeight: 800, color: C.soft, letterSpacing: '.03em' }}>NEW</span>;
    if (p.trend7d > 0) return <span style={{ fontWeight: 800, color: C.live }}>▲ {p.trend7d}</span>;
    if (p.trend7d < 0) return <span style={{ fontWeight: 800, color: C.danger }}>▼ {Math.abs(p.trend7d)}</span>;
    return <span style={{ fontWeight: 700, color: C.muted }}>±0</span>;
  };
  // Podium + chase read the board in its served (IQ Points) order regardless of
  // how the table below is sorted.
  const top3 = board.slice(0, 3);
  const myIdx = board.findIndex(isMine);
  const my = myIdx >= 0 ? board[myIdx] : null;
  let chase = null;
  if (my) {
    if (myIdx === 0) {
      const second = board[1];
      chase = { title: 'You hold #1', sub: second ? `${second.name} is ${Math.max(0, (my.xp || 0) - (second.xp || 0))} IQ Points behind you. Stay sharp.` : 'The board is yours.', pct: 100, cta: 'Defend #1' };
    } else {
      const ahead = board[myIdx - 1];
      const below = board[myIdx + 1];
      const gap = Math.max(0, (ahead.xp || 0) - (my.xp || 0));
      let sub = gap === 0 ? `You are tied with ${ahead.name} at ${(my.xp || 0).toLocaleString()} IQ Points.` : `${ahead.name} sits at ${(ahead.xp || 0).toLocaleString()} IQ Points.`;
      if (below) {
        const back = Math.max(0, (my.xp || 0) - (below.xp || 0));
        sub += back === 0 ? ` ${below.name} is tied right behind you.` : ` ${below.name} is ${back} IQ Points behind you.`;
      }
      chase = {
        title: gap === 0 ? `Tied for #${myIdx}: any game breaks it` : `The chase: ${gap} IQ Points to #${myIdx}`,
        sub,
        pct: Math.round(Math.max(6, Math.min(96, ((my.xp || 0) / Math.max(1, ahead.xp || 1)) * 100))),
        cta: `Chase #${myIdx}`,
      };
    }
  }
  const COLS = [
    { key: 'rank', label: 'Rank', w: 60, align: 'left' },
    { key: 'name', label: 'Player', align: 'left', get: (p) => (p.name || '').toLowerCase() },
    { key: 'xp', label: 'IQ', align: 'right', get: (p) => p.xp || 0 },
    ...(hasTrend ? [{ key: 'trend', label: '7-Day', align: 'right', get: (p) => (p.trend7d == null ? -1e9 : p.trend7d) }] : []),
    { key: 'correct', label: 'Correct', align: 'right', get: (p) => p.correct || 0 },
    { key: 'completed', label: 'Completed', align: 'right', get: (p) => p.completed || 0 },
    { key: 'daysPlayed', label: 'Days', align: 'right', get: (p) => p.daysPlayed || 0 },
    { key: 'accuracy', label: 'Accuracy', align: 'right', get: (p) => p.accuracy || 0 },
  ];
  const active = COLS.find((c) => c.key === sort.col) || COLS[2];
  const sorted = [...board].sort((a, b) => {
    const av = active.get ? active.get(a) : 0;
    const bv = active.get ? active.get(b) : 0;
    let cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    if (sort.dir === 'desc') cmp = -cmp;
    return cmp || (a.rank || 0) - (b.rank || 0);
  });
  const clickSort = (c) => { if (!c.get) return; setSort((st) => st.col === c.key ? { col: c.key, dir: st.dir === 'desc' ? 'asc' : 'desc' } : { col: c.key, dir: c.key === 'name' ? 'asc' : 'desc' }); };
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginBottom: 12 }}>
        {top3.map((p, i) => {
          const mine = isMine(p);
          return (
            <div key={p.userKey} style={{ background: mine ? 'var(--stg-surf2,rgba(255,255,255,0.08))' : C.bg, border: `1px solid ${mine ? 'var(--stg-acc,#7dd3fc)' : C.line}`, borderTop: `3px solid ${MEDAL[i]}`, borderRadius: '0 0 12px 12px', padding: '14px 12px 12px', textAlign: 'center', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
              <span style={{ position: 'relative', display: 'inline-flex', flex: 'none' }}>
                <Avatar name={p.name} bg={MEDAL_BG[i]} fg={MEDAL_INK[i]} size={40} />
                {i === 0 ? <span style={{ position: 'absolute', top: -7, right: -9, width: 19, height: 19, borderRadius: '50%', background: RAISE, border: `1px solid ${C.line}`, color: MEDAL_INK[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Crown size={11} /></span> : null}
              </span>
              <div style={{ marginTop: 7, fontSize: 13, fontWeight: 800, lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <button onClick={() => onSelectPlayer && onSelectPlayer(p.userKey)} style={{ border: 'none', background: 'transparent', padding: 0, font: 'inherit', fontFamily: FONT, fontWeight: 800, color: mine ? C.ink : C.accent, cursor: 'pointer' }}>{p.name}</button>
                {mine ? <span style={{ fontSize: 9.5, color: C.accent, fontWeight: 800, marginLeft: 5 }}>YOU</span> : null}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>{(p.xp || 0).toLocaleString()}</div>
              <div style={{ fontSize: 10, color: C.soft, fontWeight: 800, letterSpacing: '.05em', marginTop: 2 }}>{tierNameOf(p.level || 1).toUpperCase()} · {p.accuracy || 0}% ACC</div>
            </div>
          );
        })}
      </div>
      {chase ? (
        <div style={{ background: C.bg, borderRadius: 12, padding: '13px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ flex: 'none', color: C.accent, background: C.accsoft, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Target size={19} /></span>
          <span style={{ flex: 1, minWidth: 200 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}>{chase.title}</span>
            <span style={{ display: 'block', fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 1 }}>{chase.sub}</span>
            <span style={{ display: 'block', height: 6, borderRadius: 999, background: C.accsoft, marginTop: 8, overflow: 'hidden' }}><span style={{ display: 'block', width: `${chase.pct}%`, height: '100%', background: C.accent, borderRadius: 999 }} /></span>
          </span>
          <Link href="/quizzes" style={{ flex: 'none', fontSize: 12, fontWeight: 800, color: ON_ACC, background: C.accent, borderRadius: 9, padding: '8px 14px', textDecoration: 'none' }}>{chase.cta}</Link>
        </div>
      ) : null}
      <div style={{ fontSize: 11, color: C.soft, marginBottom: 10 }}>Top {board.length.toLocaleString()} of {Math.max(boardTotal || 0, board.length).toLocaleString()} players, anonymous guests included. Tap a column to sort; your row is highlighted.{hasTrend ? ' 7-Day = IQ Points earned over the last week.' : ''}</div>
      <div style={{ overflow: 'auto', maxHeight: 600 }}>
        <table>
          <thead><tr>
            {COLS.map((c) => (
              <th key={c.key} onClick={() => clickSort(c)} style={{ width: c.w, textAlign: c.align, whiteSpace: 'nowrap', userSelect: 'none', cursor: c.get ? 'pointer' : 'default', color: c.get && sort.col === c.key ? C.accent : undefined }}>
                {c.label}{c.get && sort.col === c.key ? (sort.dir === 'desc' ? ' ↓' : ' ↑') : ''}
              </th>
            ))}
          </tr></thead>
          <tbody>
            {sorted.map((p, idx) => {
              const mine = isMine(p);
              const viewed = !!viewKey && p.userKey === viewKey && !mine;
              const mi = idx < 3 ? idx : -1;
              return (
                <tr key={p.userKey} style={mine ? { background: C.accsoft } : (viewed ? { background: 'rgba(232,180,58,0.12)' } : undefined)}>
                  <td style={{ fontWeight: 800, color: mi >= 0 ? MEDAL_INK[mi] : C.soft }}>{idx + 1}</td>
                  <td style={{ fontWeight: (mine || viewed) ? 800 : 600, whiteSpace: 'nowrap' }}><button onClick={() => onSelectPlayer && onSelectPlayer(p.userKey)} style={{ border: 'none', background: 'transparent', padding: 0, font: 'inherit', fontFamily: FONT, fontWeight: 'inherit', color: C.accent, cursor: 'pointer', textAlign: 'left' }}>{p.name}</button>{p.isAnon ? <span style={{ fontSize: 10, color: C.soft, fontWeight: 600, marginLeft: 6 }}>guest</span> : null}{mine ? <span style={{ fontSize: 10, color: C.accent, fontWeight: 700, marginLeft: 6 }}>you</span> : null}{viewed ? <span style={{ fontSize: 10, color: GOLD_INK, fontWeight: 700, marginLeft: 6 }}>viewing</span> : null}</td>
                  <td className="score" style={{ textAlign: 'right', color: C.accent, fontWeight: 700 }}>{(p.xp || 0).toLocaleString()}</td>
                  {hasTrend ? <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{trendCell(p)}</td> : null}
                  <td style={{ textAlign: 'right' }}>{(p.correct || 0).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{p.completed || 0}</td>
                  <td style={{ textAlign: 'right' }}>{p.daysPlayed || 0}</td>
                  <td style={{ textAlign: 'right' }}>{p.accuracy || 0}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Quizzes tab ────────────────────────────────────────────────────────────
function QuizzesPanel({ me, myProfile, scope, byKey, catalog, stats, totals, totalPlays, onSelectPlayer }) {
  const found = me && me.found;
  const donePlayed = new Set((myProfile && myProfile.playedIds) || []);
  const doneCompleted = new Set((myProfile && myProfile.completedIds) || []);
  const pool = scope === 'all' ? catalog : catalog.filter((q) => q.dept === scope);
  const rows = pool.map((q) => ({ q, s: stats[q.id] || { plays: 0, avgScorePct: 0 }, leader: totals.leaders[q.id] || '', leaderKey: (totals.leaderKeys && totals.leaderKeys[q.id]) || '' }))
    .sort((a, b) => (b.s.plays || 0) - (a.s.plays || 0) || a.q.title.localeCompare(b.q.title));
  const totalCorrect = rows.reduce((acc, r) => acc + (r.s.correct || 0), 0);
  const totalPerfect = rows.reduce((acc, r) => acc + (r.s.perfect || 0), 0);
  const totalTime = totals.totalTime || 0;
  const [sort, setSort] = useState({ col: 'plays', dir: 'desc' });
  const QUIZ_COLS = [
    { key: 'title', label: 'Quiz', align: 'left', get: (r) => r.q.title.toLowerCase() },
    { key: 'plays', label: 'Plays', align: 'right', get: (r) => r.s.plays || 0 },
    { key: 'correct', label: 'Correct', align: 'right', get: (r) => r.s.correct || 0 },
    { key: 'perfect', label: 'Perfect', align: 'right', get: (r) => r.s.perfect || 0 },
    { key: 'time', label: 'Time', align: 'right', get: (r) => r.s.totalTime || 0 },
    { key: 'perPlay', label: 'Time / Play', align: 'right', get: (r) => ((r.s.plays || 0) > 0 ? (r.s.totalTime || 0) / r.s.plays : 0) },
    { key: 'leader', label: 'Top Scorer', align: 'left', get: null },
  ];
  const activeCol = QUIZ_COLS.find((c) => c.key === sort.col) || QUIZ_COLS[1];
  const sortedRows = [...rows].sort((a, b) => {
    const av = activeCol.get ? activeCol.get(a) : 0;
    const bv = activeCol.get ? activeCol.get(b) : 0;
    let cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    if (sort.dir === 'desc') cmp = -cmp;
    return cmp || (b.s.plays || 0) - (a.s.plays || 0);
  });
  const clickSort = (c) => { if (!c.get) return; setSort((stt) => stt.col === c.key ? { col: c.key, dir: stt.dir === 'desc' ? 'asc' : 'desc' } : { col: c.key, dir: c.key === 'title' ? 'asc' : 'desc' }); };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 16 }}>
        <Metric label="Total Plays" value={totalPlays.toLocaleString()} />
        <Metric label="Correct Answers" value={totalCorrect.toLocaleString()} />
        <Metric label="Perfect Quizzes" value={totalPerfect.toLocaleString()} />
        <Metric label="Time Spent" value={fmtPlayTime(totalTime)} />
      </div>
      <div className="card" style={{ padding: '4px 6px' }}>
        <div style={{ padding: '10px 10px 4px', fontSize: 13, fontWeight: 700 }}>All Quizzes <span style={{ fontWeight: 600, color: C.soft }}>({rows.length.toLocaleString()})</span></div>
        <div style={{ overflow: 'auto', maxHeight: 620 }}>
          <table>
            <thead><tr>
              {QUIZ_COLS.map((c) => (
                <th key={c.key} onClick={() => clickSort(c)} style={{ textAlign: c.align, whiteSpace: 'nowrap', userSelect: 'none', cursor: c.get ? 'pointer' : 'default', color: c.get && sort.col === c.key ? C.accent : undefined }}>{c.label}{c.get && sort.col === c.key ? (sort.dir === 'desc' ? ' ↓' : ' ↑') : ''}</th>
              ))}
            </tr></thead>
            <tbody>
              {sortedRows.map(({ q, s, leader, leaderKey }) => (
                <tr key={q.id}>
                  <td style={{ fontWeight: 600, maxWidth: 280 }}>
                    <span style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                      <Link href={`/quiz/${q.id}`} className="qlink" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{q.title}</Link>
                      {doneCompleted.has(q.id) ? <Star size={13} strokeWidth={1.5} fill={T.gold} color={T.goldInk} style={{ flex: 'none', marginLeft: 5 }} aria-label="Completed (100%)" /> : donePlayed.has(q.id) ? <Check size={13} strokeWidth={2.75} style={{ flex: 'none', color: 'var(--stg-good,#6ee7b7)', marginLeft: 5 }} aria-label="Played" /> : null}
                    </span>
                  </td>
                  <td className="score" style={{ textAlign: 'right' }}>{(s.plays || 0).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(s.correct || 0).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(s.perfect || 0).toLocaleString()}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtPlayTime(s.totalTime || 0)}</td>
                  <td className="score" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{(s.plays || 0) > 0 ? mmss((s.totalTime || 0) / s.plays) : '—'}</td>
                  <td>{leader ? (leaderKey ? <button onClick={() => onSelectPlayer && onSelectPlayer(leaderKey)} style={{ border: 'none', background: 'transparent', padding: 0, font: 'inherit', fontFamily: FONT, color: C.accent, cursor: 'pointer', textAlign: 'left' }}>{leader}</button> : leader) : <span style={{ color: C.soft }}>Empty</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Challenges tab: REMOVED (owner, 2026-08-25) ─────────────────────
// The Stat Hub no longer carries a Challenges tab. What stood here was the tab
// tile, the challenge picker and standings grid (ChallengesPanel), and the
// Winners' Circle record of every challenge's top finisher. All of it is gone
// from this page. An old ?tab=challenges link now falls through to Player,
// because ?tab= now only scrolls to a section, and there is no such section.
//
// THE WIRING UNDER IT IS DELIBERATELY LEFT INTACT (owner: "keep the wiring, but
// delete"). lib/challenges.js, DAILY_CHALLENGE_ON, the /api/quiz/challenge-*
// routes, /challenge/[id] and the quiz home's challenge chip and dropdown are
// all untouched, so this comes back by restoring a panel rather than by
// rebuilding a feature. Anything still linking to /quizzes/hub?tab=challenges
// (the quiz home chip and dropdown, the challenge page's full-standings button,
// and the /quizzes/leaderboard redirect) lands on the hub's Player tab until it
// is repointed.
// ─── IQ Points tab ────────────────────────────────────────────────────────────────
// IQ & Level view: the level, progress to the next level, and the cumulative
// IQ Points trend chart lead; the formula explainer collapses behind a "How this
// works" toggle. IQ Points are additive: they never go down and never decay.

