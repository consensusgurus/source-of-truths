'use client';
// CHALLENGE A FRIEND, FOR THE RUNS (owner, 2026-10-07; every run 2026-10-15).
// The runs end on their own screens, never on the daily end
// card, so the gold door that card carries had nowhere to live on them. This
// is that door as a button, the line the receiver ends on, and the day token
// the two runs with no board number are matched by. The link, the landing and
// the preview card are the daily ones: /vs, lib/challenge.js.
import { useEffect, useState } from 'react';
import { encodeChallenge, readChallenge, runDayNum, ymdCompact, RUN_CHALLENGES, challengeFig, challengeResult } from '@/lib/challenge';
import { withRef, myRefCode, ensureMyRefCode } from '@/lib/referrals';
import { drawingIsLive, DRAWING } from '@/lib/drawing';
import { newCid, withCid, recordSend, reportTake } from '@/lib/challenge-client';
import TicketDoor from './TicketDoor';

// A QUESTIONS-RIGHT RUN SHARES ITS COUNT, NEVER ITS DENOMINATOR (owner,
// 2026-10-15): "61 right", not "61 of 180". Scores on a one-life run sit far
// below the total, and the total read as discouraging in every share.
// Read off the registry, so every questions-right run follows it, not just the
// Trivia Gauntlet it was written for.
const unitOf = (k) => (RUN_CHALLENGES[k] ? RUN_CHALLENGES[k].unit : 'points');
const rightOnly = (k) => unitOf(k) === 'right';

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

export function RunChallengeButton({ gameKey, score, total, n, t = null, won = false, status = '', archive = false, style = null, className = '', door = false }) {
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
  // EVERY CONCLUSION OFFERS IT, A ZERO INCLUDED (owner, 2026-10-15). A run
  // with nothing banked dares the friend to beat it rather than hiding the door.
  const blank = !(score > 0) && !won;
  const send = () => {
    let who = 'A friend';
    try { who = (JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null') || {}).username || who; } catch (e) { /* a guest */ }
    const o = rightOnly(gameKey) ? 0 : total;
    const d = archive ? 0 : ymdCompact(etToday());
    // A blank run still carries something to beat, or the link will not decode.
    const tt = t != null ? t : (blank && !o ? 0 : null);
    const raw = encodeChallenge({ name: who, t: tt, s: score, o, n, won: !!won, d, x: status });
    const cid = newCid();
    const url = withRef(withCid(`${window.location.origin}/vs?g=${encodeURIComponent(gameKey)}&vs=${encodeURIComponent(raw)}&v=3`, cid));
    recordSend({ cid, gameKey, num: n, day: d ? etToday() : null, fig: { s: score, o, t: tt, won: !!won, x: status }, source: 'run' });
    const copied = () => { setMsg('Link copied. Paste it to a friend.'); };
    const copy = () => { try { navigator.clipboard.writeText(url).then(copied, () => setMsg(url)); } catch (e) { setMsg(url); } };
    let touch = false;
    try { touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { touch = false; }
    if (touch && navigator.share) { navigator.share({ url }).catch(() => {}); } else copy();
  };
  const back = them && Number(them.n) === Number(n);
  const label = back ? `Challenge ${them.name} back` : 'Challenge a friend';
  const fig = won && t != null && unitOf(gameKey) === 'time' ? `${Math.floor(t / 60)}:${String(Math.round(t) % 60).padStart(2, '0')}`
    : rightOnly(gameKey) ? `${score} right` : total ? `${score} of ${total}` : String(score);
  const lead = blank ? 'Dare them to beat it.' : `Send them ${fig} to beat.`;
  if (door && draw) {
    return (
      <TicketDoor fig={blank ? '' : fig} label={label} go={msg.startsWith('Link copied') ? 'Copied' : (blank ? 'Send' : `Send ${fig}`)} msg={msg} onSend={send} style={style}
        foot={archive ? null : 'Today\u2019s run only. One ticket for every new player who finishes from your link. No purchase necessary.'} />
    );
  }
  if (door) {
    const sb = msg || (draw
      ? <>{lead}<b style={{ display: 'block', fontWeight: 800 }}>{credit ? `New players = ${DRAWING.prizeLabel} drawing tickets.` : `Pick a name to earn ${DRAWING.prizeLabel} tickets.`}</b></>
      : (credit
        ? `${lead} Challenging earns you share credit.`
        : `${lead} Pick a player name and challenges earn share credit.`));
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: DOOR_CSS }} />
        <button type="button" className={'rch-door' + (className ? ' ' + className : '')} style={style || undefined} onClick={send}>
          <span className="rch-ic">{FLAG}</span>
          <span className="rch-tx"><span className="rch-nm">{label}</span><span className="rch-sb">{sb}</span></span>
          <span className="rch-go">{msg.startsWith('Link copied') ? 'Copied' : 'Send'}</span>
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

// What the receiver's ending says about the two results. Decided by
// challengeResult, so a clock run (Valet) compares clocks and every other run
// compares scores, exactly as the daily duel does.
export function RunChallengeLine({ gameKey, score, n, total = 0, t = null, won = false, style = null }) {
  const [them, setThem] = useState(null);
  useEffect(() => { setThem(readChallenge(gameKey)); }, [gameKey]);
  const o = rightOnly(gameKey) ? 0 : (total || 0);
  const mine = { s: score, o, t, won: !!won };
  const same = !!(them && Number(them.n) === Number(n));
  const res = same ? (challengeResult(mine, { ...them, o: them.o && o ? them.o : o }, gameKey) || { res: 'tie' }).res : null;
  // The return leg: tell the sender how it went (lib/challenge-client.js).
  useEffect(() => {
    if (!same) return;
    reportTake(gameKey, mine, res || 'tie');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [same, res, score, gameKey]);
  if (!same) return null;
  const yf = challengeFig(mine, gameKey);
  const tf = challengeFig(them, gameKey);
  const line = res === 'win' ? `You beat ${them.name}: ${yf} to ${tf}.`
    : res === 'loss' ? `${them.name} holds it: ${tf} to ${yf}.` : `Level with ${them.name} on ${yf}.`;
  return (
    <div role="status" style={{ display: 'inline-block', background: '#e8b43a', color: '#2a1f04', borderRadius: 8, padding: '8px 14px', fontSize: 14.5, fontWeight: 800, margin: '0 0 12px', ...(style || {}) }}>
      {line}
    </div>
  );
}

// Reads the challenge off the URL the moment a run page mounts, so it is kept
// for the tab (sessionStorage) even when the run later rewrites its own URL.
// Renders nothing; the finish's RunChallengeLine shows the result.
export function RunChallengeCapture({ gameKey }) {
  useEffect(() => { readChallenge(gameKey); }, [gameKey]);
  return null;
}
