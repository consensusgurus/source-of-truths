'use client';

// Global trophy-unlock toast, mounted once in the root layout (like
// ShareCreditPop). Any surface that learns the player's earned trophy ids
// (QuizStandings via /api/quiz/me, DailyEndCard via /api/quiz/iq-standing)
// calls notifyTrophies(ids); this component diffs them against the ids already
// celebrated on this device (localStorage) and pops a card for each new one,
// linking to the player's Trophy Case.
//
// First sighting on a device sets the baseline SILENTLY: an existing player's
// retroactive trophies should fill their case, not fire a 30-toast salute.

import { useEffect, useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { TROPHY_BY_ID, TROPHY_TIERS } from '@/lib/trophy-defs';
import { T } from '@/lib/theme';
import { gameActive } from '@/lib/game-active';

export const TROPHY_EVENT = 'sot:trophies';
const SEEN_KEY = 'sot_trophies_seen';
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

export function notifyTrophies(ids) {
  if (typeof window === 'undefined' || !Array.isArray(ids)) return;
  try { window.dispatchEvent(new CustomEvent(TROPHY_EVENT, { detail: { ids } })); } catch (e) { /* no-op */ }
}

function readSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw == null) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return null; }
}

function writeSeen(arr) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(arr)); } catch (e) { /* no-op */ }
}

function caseHref() {
  try {
    const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
    if (id && id.username) return `/player/${encodeURIComponent(id.username)}`;
  } catch (e) { /* fall through */ }
  return '/quizzes/hub';
}

export default function TrophyPop() {
  const [queue, setQueue] = useState([]);
  // NEVER MID GAME (owner, 2026-10-23): an unlock earned between two puzzles
  // of a run waits, held, until no game is in play.
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!queue.length) { setHeld(false); return undefined; }
    const check = () => setHeld(gameActive());
    check();
    const t = setInterval(check, 1000);
    return () => clearInterval(t);
  }, [queue.length]);

  useEffect(() => {
    const onIds = (ev) => {
      const ids = (ev && ev.detail && ev.detail.ids) || [];
      if (!Array.isArray(ids) || !ids.length) return;
      const seen = readSeen();
      if (seen == null) { writeSeen(ids); return; } // silent baseline
      const fresh = ids.filter((id) => !seen.includes(id) && TROPHY_BY_ID[id]);
      if (!fresh.length) {
        if (ids.some((id) => !seen.includes(id))) writeSeen([...new Set([...seen, ...ids])]);
        return;
      }
      writeSeen([...new Set([...seen, ...ids])]);
      setQueue((q) => [...q, ...fresh.filter((id) => !q.includes(id))]);
    };
    window.addEventListener(TROPHY_EVENT, onIds);
    return () => window.removeEventListener(TROPHY_EVENT, onIds);
  }, []);

  // Auto-advance the queue.
  useEffect(() => {
    if (!queue.length || held) return undefined;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 6000);
    return () => clearTimeout(t);
  }, [queue, held]);

  if (!queue.length || held) return null;
  const t = TROPHY_BY_ID[queue[0]];
  if (!t) return null;
  const tier = TROPHY_TIERS[t.tier] || TROPHY_TIERS.bronze;

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 400, fontFamily: FONT, maxWidth: 'calc(100vw - 32px)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: 320, maxWidth: '100%', background: T.white, border: `1px solid ${tier.ring}`, borderLeft: `5px solid ${tier.ring}`, borderRadius: 13, padding: '13px 14px', boxShadow: '0 10px 30px rgba(20,22,28,0.18)' }}>
        <span style={{ flex: 'none', width: 40, height: 40, borderRadius: '50%', background: tier.bg, color: tier.fg, border: `2px solid ${tier.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trophy size={19} /></span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: tier.fg }}>{tier.label} trophy unlocked</span>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: T.ink, marginTop: 2 }}>{t.name}</span>
          <span style={{ display: 'block', fontSize: 11.5, color: T.muted, lineHeight: 1.45, marginTop: 2 }}>{t.desc}</span>
          <a href={caseHref()} style={{ display: 'inline-block', marginTop: 7, fontSize: 11.5, fontWeight: 800, color: T.accent, textDecoration: 'none' }}>View your Trophy Case →</a>
        </span>
        <button onClick={() => setQueue((q) => q.slice(1))} aria-label="Dismiss" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9aa1ad', display: 'flex', padding: 2 }}><X size={15} /></button>
      </div>
    </div>
  );
}
