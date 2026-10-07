'use client';
// CHALLENGE A FRIEND, FOR THE RUNS (owner, 2026-10-07). The Trivia Gauntlet,
// Price Check and Passport end on their own screens, never on the daily end
// card, so the gold door that card carries had nowhere to live on them. This
// is that door as a button, the line the receiver ends on, and the day token
// the two runs with no board number are matched by. The link, the landing and
// the preview card are the daily ones: /vs, lib/challenge.js.
import { useEffect, useState } from 'react';
import { encodeChallenge, readChallenge, runDayNum, ymdCompact } from '@/lib/challenge';

const etToday = () => {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
};
// Gauntlet and Price Check have no board number, so the day stands in for one.
export const runToken = () => runDayNum(etToday());

const GOLD = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#e8b43a', color: '#2a1f04',
  border: 0, borderRadius: 9, padding: '11px 18px', font: 'inherit', fontSize: 14.5, fontWeight: 800, cursor: 'pointer', textDecoration: 'none',
};

export function RunChallengeButton({ gameKey, score, total, n, t = null, status = '', archive = false, style = null, className = '' }) {
  const [msg, setMsg] = useState('');
  const [them, setThem] = useState(null);
  useEffect(() => { setThem(readChallenge(gameKey)); }, [gameKey]);
  if (!(score > 0)) return null;
  const send = () => {
    let who = 'A friend';
    try { who = (JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null') || {}).username || who; } catch (e) { /* a guest */ }
    const raw = encodeChallenge({ name: who, t, s: score, o: total, n, won: false, d: archive ? 0 : ymdCompact(etToday()), x: status });
    const url = `${window.location.origin}/vs?g=${encodeURIComponent(gameKey)}&vs=${encodeURIComponent(raw)}&v=3`;
    const copied = () => { setMsg('Link copied. Paste it to a friend.'); };
    const copy = () => { try { navigator.clipboard.writeText(url).then(copied, () => setMsg(url)); } catch (e) { setMsg(url); } };
    let touch = false;
    try { touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { touch = false; }
    if (touch && navigator.share) { navigator.share({ url }).catch(() => {}); } else copy();
  };
  const back = them && Number(them.n) === Number(n);
  return (
    <button type="button" className={className} style={{ ...GOLD, ...(style || {}) }} onClick={send}>
      {msg || (back ? `Challenge ${them.name} back` : 'Challenge a friend')}
    </button>
  );
}

// What the receiver's ending says about the two totals.
export function RunChallengeLine({ gameKey, score, n, style = null }) {
  const [them, setThem] = useState(null);
  useEffect(() => { setThem(readChallenge(gameKey)); }, [gameKey]);
  if (!them || Number(them.n) !== Number(n)) return null;
  const d = score - them.s;
  const line = d > 0 ? `You beat ${them.name}: ${score} to ${them.s}.`
    : d < 0 ? `${them.name} holds it: ${them.s} to ${score}.` : `Level with ${them.name} on ${score}.`;
  return (
    <div role="status" style={{ display: 'inline-block', background: '#e8b43a', color: '#2a1f04', borderRadius: 8, padding: '8px 14px', fontSize: 14.5, fontWeight: 800, margin: '0 0 12px', ...(style || {}) }}>
      {line}
    </div>
  );
}
