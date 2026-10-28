'use client';
// THE TICKET DOOR (owner, 2026-10-15). The Challenge a friend button while the
// $100 drawing is live: it leads with the player's own ticket count ("You have
// 0 tickets for the $100 drawing"), draws the ticket, and puts the send on one
// dark button inside the gold card. Mock-up: claude.ai/artifact/YJbzZkVJA4KUnkBEX1d6QK.
//
// Used by the daily end card (app/StageFinish.jsx) and the three runs
// (app/RunChallenge.jsx). Outside the drawing window both keep their old door.
//
// WORDING RULE (lib/drawing.js): it is a DRAWING, never a raffle, and the terms
// line says "No purchase necessary".
//
// Gold #e8b43a with #2a1f04 ink reads in both registers, which is why the card
// carries its own colours rather than stage tokens.
//
// QUIETED 2026-10-22 (owner picked option A of the "Quieter Challenge Card"
// canvas): no shine, ring, wiggle or nudge, one headline and one line, the
// terms folded into a footer that also carries the group invite.
import { useEffect, useState } from 'react';
import { DRAWING, formatTickets } from '@/lib/drawing';
import { fetchMine } from '@/lib/challenge-client';
import { savedIdentity } from '@/lib/saved-identity';
import JoinLeaderboardForm from './quiz/[id]/JoinLeaderboardForm';
import useGroupStanding from './groups/groupStanding';
import { withRef } from '@/lib/referrals';

const CSS = `
.tkd{position:relative;background:var(--tkd-bg,#e8b43a);color:var(--tkd-ink,#2a1f04);border-radius:16px;padding:18px 20px 14px;
  display:flex;flex-direction:column;gap:14px;font-family:inherit;text-align:left;}
.tkd-top{display:flex;align-items:center;gap:18px;}
.tkd-tk{flex:none;position:relative;width:104px;height:70px;}
.tkd-tk svg{display:block;}
.tkd-n{position:absolute;left:30px;right:0;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;}
.tkd-n b{font-size:26px;font-weight:800;letter-spacing:-.03em;white-space:nowrap;}
.tkd-n b.lg{font-size:21px;}
.tkd-n b sup{font-size:.55em;vertical-align:.7em;margin-left:1px;line-height:0;}
.tkd-n i{font-style:normal;font-size:8.5px;font-weight:800;letter-spacing:.14em;margin-top:3px;}
.tkd-tx{flex:1;min-width:0;}
.tkd-hd{font-size:20px;font-weight:800;letter-spacing:-.01em;line-height:1.2;}
.tkd-sb{font-size:13.5px;font-weight:700;line-height:1.4;margin-top:4px;color:var(--tkd-sub,#4a3a12);}
.tkd-sb b{font-weight:800;color:var(--tkd-ink,#2a1f04);}
.tkd-go{flex:none;display:flex;align-items:center;gap:8px;height:48px;padding:0 18px;border:0;border-radius:12px;
  background:var(--tkd-ink,#2a1f04);color:var(--tkd-go-ink,#fff4d6);font:inherit;font-size:14px;font-weight:800;cursor:pointer;white-space:nowrap;}
.tkd-go:hover{filter:brightness(1.2);}
.tkd-go:focus-visible,.tkd-claim:focus-visible,.tkd-inv:focus-visible{outline:2px solid var(--tkd-ink,#2a1f04);outline-offset:3px;}
.tkd-claim{all:unset;cursor:pointer;display:inline;text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:3px;}
.tkd-claim span{font-size:.9em;margin-left:6px;}
.tkd-form{background:var(--tkd-paper,#fff8e6);border-radius:12px;padding:4px 14px 14px;
  --join-head:var(--tkd-ink,#2a1f04);--join-body:var(--tkd-sub,#4a3a12);--join-soft:#6b5622;--join-field-bg:#ffffff;--join-field-ink:var(--tkd-ink,#2a1f04);--join-field-line:var(--tkd-ink,#2a1f04);--join-cta:var(--tkd-ink,#2a1f04);--join-cta-ink:var(--tkd-go-ink,#fff4d6);}
.tkd-ft{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
  border-top:1.5px solid color-mix(in srgb, var(--tkd-ink,#2a1f04) 18%, transparent);padding-top:10px;font-size:11.5px;font-weight:700;color:var(--tkd-sub,#4a3a12);}
.tkd-inv{all:unset;cursor:pointer;font-size:12.5px;font-weight:800;color:var(--tkd-ink,#2a1f04);border:1.5px solid color-mix(in srgb, var(--tkd-ink,#2a1f04) 50%, transparent);
  border-radius:8px;padding:6px 10px;white-space:nowrap;}
.tkd-inv:hover{border-color:var(--tkd-ink,#2a1f04);}
.tkd-m,.tkd-pinv,.tkd-tshort{display:none;}
/* THE PHONE CARD IS TWO LINES (owner, 2026-10-28): "Share for your chance to
   win $500", then "You have N tickets", with the send button beside them. No
   ticket drawing, no headline, no to-beat line. */
@media (max-width:560px){
  .tkd{padding:12px 12px 9px 14px;gap:8px;}
  .tkd-top{gap:8px 10px;flex-wrap:wrap;}
  .tkd-tk,.tkd-tx{display:none;}
  .tkd-m{display:block;flex:1 1 190px;min-width:0;}
  .tkd-m b{display:block;font-size:15.5px;font-weight:800;line-height:1.25;}
  .tkd-m>span{display:block;font-size:13px;font-weight:700;line-height:1.35;margin-top:2px;color:var(--tkd-sub,#4a3a12);}
  .tkd-m .tkd-claim{font-size:13px;font-weight:800;color:var(--tkd-ink,#2a1f04);}
  .tkd-go{flex:none;height:38px;padding:0 14px;font-size:13.5px;}
  .tkd-ft{padding-top:7px;font-size:10.5px;gap:6px;}
  .tkd-ft .tkd-inv,.tkd-tlong{display:none;}
  .tkd-tshort{display:inline;}
  .tkd-pinv{display:inline-flex;align-items:center;}
  .tkd-pinv .tkd-inv{font-size:12px;padding:0 10px;height:38px;display:inline-flex;align-items:center;box-sizing:border-box;}
}
`;

export const TICKET_PATH = 'M9 1 H87 A8 8 0 0 1 95 9 V25 A8 8 0 0 0 95 41 V57 A8 8 0 0 1 87 65 H9 A8 8 0 0 1 1 57 V41 A8 8 0 0 0 1 25 V9 A8 8 0 0 1 9 1 Z';

// The viewer's ticket count, or null until it is known. Named is read off the
// stored identity at once, so the right headline paints before the count lands.
export function useMyTickets() {
  const [state, setState] = useState({ named: null, count: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    const named = !!savedIdentity().username;
    setState({ named, count: null });
    if (!named) return undefined;
    fetchMine().then((d) => {
      if (!live || !d) return;
      setState({ named: d.named || named, count: Number.isFinite(d.tickets) ? d.tickets : null });
    });
    return () => { live = false; };
  }, [tick]);
  return { ...state, refresh: () => setTick((t) => t + 1) };
}

// The count on the stub. A fraction is drawn small and raised, and a three
// digit count steps down a size, so "35½" and "120¾" both stay on the ticket
// (owner, 2026-10-22: the ½ ran off the stub at 30px).
function StubCount({ n }) {
  const txt = formatTickets(n);
  const m = /^(\d*)([¼½¾]?)$/.exec(txt) || [null, txt, ''];
  const whole = m[1];
  const frac = m[2];
  return (
    <b className={whole.length >= 3 || (whole.length >= 2 && frac) ? 'lg' : ''}>
      {whole}{frac ? <sup>{frac}</sup> : null}
    </b>
  );
}

// BRING THEM INTO YOUR GROUP (owner, 2026-10-22). A member's challenge card
// also offers the group's own link, so a friend who plays can stay. Shown only
// to a player already in a group; the link carries the referral code, so a new
// player who joins and finishes still earns the tickets.
function GroupInvite() {
  const data = useGroupStanding('today');
  const [msg, setMsg] = useState('');
  const g = data && data.groups && data.groups[0];
  if (!g || !g.code) return null;
  const send = () => {
    const url = withRef(`${window.location.origin}/g/${g.code}`);
    const copy = () => {
      try { navigator.clipboard.writeText(url).then(() => setMsg('Group link copied'), () => setMsg(url)); } catch (e) { setMsg(url); }
    };
    let touch = false;
    try { touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { touch = false; }
    if (touch && navigator.share) navigator.share({ url }).catch(() => {}); else copy();
  };
  return (
    <button type="button" className="tkd-inv" onClick={send} aria-live="polite">
      {msg || `Invite a friend to ${g.name}`}
    </button>
  );
}

// OPTION A, THE QUIET CARD (owner, 2026-10-22). One headline, one line, one
// button; nothing moves. Three cases share it:
//  · a plain finish: "Challenge a friend to today's Crux" and what to beat;
//  · a run: the line names the rank the run earned (title), so a friend is
//    dared to beat a Brown belt, not a bare number;
//  · SEND IT BACK: a player who came in on a friend's link sees the result
//    against them as the headline, and the button returns the dare (vs).
// `fig` is the figure to beat ('' = nothing yet), `title` a run's rank,
// `vs` { name, res: 'win'|'loss'|'tie', mine, theirs }.
export default function TicketDoor({ fig = '', title = '', vs = null, label = 'Challenge a friend', go = 'Send link', game = '', msg = '', onSend, foot = null, style = null }) {
  const { named, count, refresh } = useMyTickets();
  const [older, setOlder] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  useEffect(() => { try { setOlder(/[?&]p=\d+/.test(window.location.search)); } catch (e) { /* today's */ } }, []);
  const what = game ? `${older ? 'this' : 'today’s'} ${game}` : (older ? 'this puzzle' : 'today’s puzzle');
  const n = Number.isFinite(count) ? count : 0;
  const copied = go === 'Copied';
  const head = vs
    ? (vs.res === 'win' ? `You beat ${vs.name}, ${vs.mine} to ${vs.theirs}`
      : vs.res === 'loss' ? `${vs.name} holds it, ${vs.theirs} to ${vs.mine}`
        : `Level with ${vs.name} on ${vs.mine}`)
    : (label && label !== 'Challenge a friend' && !/ back$/.test(label) ? label : `Challenge a friend to ${what}`);
  const mark = fig ? <><b>To beat:</b> {title ? `${title} · ` : ''}{fig}.</> : <>Nothing to beat yet, so they go first.</>;
  const tail = named === false
    ? `Name yourself and each new friend who finishes adds ${DRAWING.friendTickets} tickets.`
    : n === 0 ? 'Your first ticket is one friend away.'
      : `A new friend who finishes adds ${DRAWING.friendTickets} tickets.`;
  const sub = msg
    ? <span role="status">{msg}</span>
    : vs ? <>{vs.res === 'loss' ? 'Send it back for a rematch, or dare someone new.' : `Send it back to ${vs.name}, or dare someone new.`} {tail}</>
      : <>{mark} {tail}</>;
  const btn = copied ? 'Copied' : vs ? 'Send it back' : 'Send link';
  return (
    <section className="tkd" style={style || undefined} aria-label="Challenge a friend">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="tkd-top">
        <div className="tkd-tk" aria-label={`${formatTickets(n)} tickets`} role="img">
          <svg width="104" height="70" viewBox="0 0 96 66" aria-hidden="true">
            <path d={TICKET_PATH} strokeWidth="2" style={{ fill: 'var(--tkd-paper,#fff8e6)', stroke: 'var(--tkd-ink,#2a1f04)' }} />
            <line x1="27" y1="7" x2="27" y2="59" strokeWidth="2" strokeDasharray="3 4" style={{ stroke: 'var(--tkd-ink,#2a1f04)' }} />
            <text x="14" y="38" textAnchor="middle" fontFamily="inherit" fontSize="9" fontWeight="800" style={{ fill: 'var(--tkd-ink,#2a1f04)' }} transform="rotate(-90 14 33)">{DRAWING.prizeLabel}</text>
          </svg>
          <span className="tkd-n" aria-hidden="true"><StubCount n={n} /><i>TICKETS</i></span>
        </div>
        <div className="tkd-m">
          <b>Share for your chance to win {DRAWING.prizeLabel}</b>
          {msg ? <span role="status">{msg}</span>
            : named === false && !claimed ? (
              <span><button type="button" className="tkd-claim" aria-expanded={claimOpen} onClick={() => setClaimOpen((v) => !v)}>
                Pick a name to earn tickets<span aria-hidden="true">{claimOpen ? '↑' : '→'}</span>
              </button></span>
            ) : <span>You have {formatTickets(n)} {n === 1 ? 'ticket' : 'tickets'}</span>}
        </div>
        <div className="tkd-tx">
          <div className="tkd-hd">{named === false && !claimed && !vs ? (
            <button type="button" className="tkd-claim" aria-expanded={claimOpen} onClick={() => setClaimOpen((v) => !v)}>
              Pick a name to earn tickets<span aria-hidden="true">{claimOpen ? '↑' : '→'}</span>
            </button>
          ) : head}</div>
          <div className="tkd-sb">{sub}</div>
        </div>
        <button type="button" className="tkd-go" onClick={onSend}>
          {btn}
          {copied ? null : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
          )}
        </button>
        <span className="tkd-pinv"><GroupInvite /></span>
      </div>
      {claimOpen && !claimed ? (
        <div className="tkd-form">
          <JoinLeaderboardForm heading="Pick a name" hideIcon
            onJoined={() => { setClaimed(true); setClaimOpen(false); refresh(); }} />
        </div>
      ) : null}
      <div className="tkd-ft">
        <span className="tkd-tlong">{DRAWING.prizeLabel} drawing {'·'} ends {DRAWING.endLabel} {'·'} no purchase necessary</span>
        <span className="tkd-tshort">Drawing ends {DRAWING.endLabel}. No purchase necessary.</span>
        <GroupInvite />
      </div>
    </section>
  );
}
