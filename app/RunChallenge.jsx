'use client';
// CHALLENGE A FRIEND, FOR THE RUNS (owner, 2026-10-07). The Trivia Gauntlet,
// Price Check and Passport end on their own screens, never on the daily end
// card, so the gold door that card carries had nowhere to live on them. This
// is that door as a button, the line the receiver ends on, and the day token
// the two runs with no board number are matched by. The link, the landing and
// the preview card are the daily ones: /vs, lib/challenge.js.
import { useEffect, useState } from 'react';
import { encodeChallenge, readChallenge, runDayNum, ymdCompact } from '@/lib/challenge';
import { withRef, myRefCode, ensureMyRefCode } from '@/lib/referrals';
import { drawingIsLive, DRAWING } from '@/lib/drawing';

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

// THE DOOR (owner, 2026-10-07). door={true} draws the button as the daily end
// card's gold Challenge door (StageFinish .stf-door.chal): flag in a box, the name,
// a sub line, and a Send chip. Its styles are inline and self-contained so it
// reads the same on any run screen.
const DOOR_CSS = `
.rch-door{display:flex;align-items:center;gap:14px;width:100%;min-height:92px;padding:17px;text-align:left;cursor:pointer;
  font:inherit;background:#e8b43a;color:#2a1f04;border:1px solid #e8b43a;border-radius:10px;}
.rch-door:hover{filter:brightness(1.05);}
.rch-door:focus-visible{outline:2px solid #2a1f04;outline-offset:2px;}
.rch-ic{flex:none;width:56px;height:56px;border-radius:12px;display:grid;place-items:center;background:rgba(42,31,4,.14);}
.rch-tx{flex:1;min-width:0;}
.rch-nm{display:block;font-size:18px;font-weight:800;letter-spacing:-.01em;line-height:1.2;}
.rch-sb{display:block;margin-top:3px;font-size:12.5px;font-weight:700;line-height:1.35;}
.rch-go{flex:none;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;
  border:1.5px solid currentColor;border-radius:6px;padding:6px 10px;}
@media (max-width:640px){ .rch-door{gap:11px;padding:14px;} .rch-ic{width:46px;height:46px;} .rch-nm{font-size:16px;} }
`;
const FLAG = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" />
  </svg>
);

export function RunChallengeButton({ gameKey, score, total, n, t = null, status = '', archive = false, style = null, className = '', door = false }) {
  const [msg, setMsg] = useState('');
  const [them, setThem] = useState(null);
  const [credit, setCredit] = useState(false);
  const [draw, setDraw] = useState(false);
  useEffect(() => { setDraw(drawingIsLive()); }, []);
  useEffect(() => { setThem(readChallenge(gameKey)); }, [gameKey]);
  // A registered player's link carries their referral code, so a friend who comes
  // in through it and finishes a game credits them, same as the share link.
  useEffect(() => {
    let live = true;
    if (myRefCode()) { setCredit(true); return undefined; }
    Promise.resolve(ensureMyRefCode()).then(() => { if (live && myRefCode()) setCredit(true); }).catch(() => {});
    return () => { live = false; };
  }, []);
  if (!(score > 0)) return null;
  const send = () => {
    let who = 'A friend';
    try { who = (JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null') || {}).username || who; } catch (e) { /* a guest */ }
    const raw = encodeChallenge({ name: who, t, s: score, o: total, n, won: false, d: archive ? 0 : ymdCompact(etToday()), x: status });
    const url = withRef(`${window.location.origin}/vs?g=${encodeURIComponent(gameKey)}&vs=${encodeURIComponent(raw)}&v=3`);
    const copied = () => { setMsg('Link copied. Paste it to a friend.'); };
    const copy = () => { try { navigator.clipboard.writeText(url).then(copied, () => setMsg(url)); } catch (e) { setMsg(url); } };
    let touch = false;
    try { touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { touch = false; }
    if (touch && navigator.share) { navigator.share({ url }).catch(() => {}); } else copy();
  };
  const back = them && Number(them.n) === Number(n);
  const label = back ? `Challenge ${them.name} back` : 'Challenge a friend';
  if (door) {
    const fig = total ? `${score} of ${total}` : String(score);
    const sb = msg || (draw
      ? <>Send them {fig} to beat.<b style={{ display: 'block', fontWeight: 800 }}>{credit ? `New players = ${DRAWING.prizeLabel} drawing tickets.` : `Pick a name to earn ${DRAWING.prizeLabel} tickets.`}</b></>
      : (credit
        ? `Send them ${fig} to beat. Challenging earns you share credit.`
        : `Send them ${fig} to beat. Pick a player name and challenges earn share credit.`));
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: DOOR_CSS }} />
        <button type="button" className={'rch-door' + (className ? ' ' + className : '')} style={style || undefined} onClick={send}>
          <span className="rch-ic">{FLAG}</span>
          <span className="rch-tx"><span className="rch-nm">{label}</span><span className="rch-sb">{sb}</span></span>
          <span className="rch-go">{msg ? 'Sent' : 'Send'}</span>
        </button>
      </>
    );
  }
  return (
    <button type="button" className={className} style={{ ...GOLD, ...(style || {}) }} onClick={send}>
      {msg || label}
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
