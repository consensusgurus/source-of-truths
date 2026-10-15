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
import { useEffect, useState } from 'react';
import { DRAWING } from '@/lib/drawing';
import { fetchMine } from '@/lib/challenge-client';
import { savedIdentity } from '@/lib/saved-identity';

const CSS = `
.tkd{position:relative;overflow:hidden;background:#e8b43a;color:#2a1f04;border-radius:16px;padding:16px;
  display:flex;flex-direction:column;gap:14px;font-family:inherit;text-align:left;animation:tkdRing 2.4s ease-out infinite;}
.tkd-sh{position:absolute;top:-20px;bottom:-20px;left:0;width:70px;pointer-events:none;
  background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.5),rgba(255,255,255,0));animation:tkdShine 4.2s ease-in-out infinite;}
.tkd-top{position:relative;display:flex;align-items:center;gap:14px;}
.tkd-tk{flex:none;position:relative;width:96px;height:66px;transform-origin:50% 90%;animation:tkdWig 3.6s ease-in-out infinite;}
.tkd-tk svg{display:block;}
.tkd-n{position:absolute;left:28px;right:0;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;}
.tkd-n b{font-size:30px;font-weight:800;letter-spacing:-.03em;}
.tkd-n i{font-style:normal;font-size:8.5px;font-weight:800;letter-spacing:.14em;margin-top:2px;}
.tkd-tx{min-width:0;}
.tkd-eb{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;}
.tkd-hd{font-size:21px;font-weight:800;letter-spacing:-.02em;line-height:1.14;margin-top:4px;}
.tkd-sb{font-size:13px;font-weight:700;line-height:1.38;margin-top:5px;}
.tkd-go{position:relative;min-height:52px;border:0;border-radius:12px;background:#2a1f04;color:#fff4d6;font:inherit;
  display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 16px;cursor:pointer;}
.tkd-go:hover{filter:brightness(1.18);}
.tkd-go:focus-visible{outline:2px solid #2a1f04;outline-offset:3px;}
.tkd-gl{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:800;text-align:left;}
.tkd-gr{display:flex;align-items:center;gap:6px;flex:none;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#e8b43a;animation:tkdNudge 2.4s ease-in-out infinite;}
.tkd-ft{position:relative;font-size:11.5px;font-weight:700;line-height:1.4;text-align:center;}
@keyframes tkdWig{0%,78%,100%{transform:rotate(-7deg) translateY(0)}84%{transform:rotate(5deg) translateY(-4px)}90%{transform:rotate(-10deg) translateY(0)}95%{transform:rotate(-4deg) translateY(-2px)}}
@keyframes tkdShine{0%,62%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(900%) skewX(-18deg)}}
@keyframes tkdRing{0%{box-shadow:0 0 0 0 rgba(232,180,58,.55)}70%{box-shadow:0 0 0 12px rgba(232,180,58,0)}100%{box-shadow:0 0 0 0 rgba(232,180,58,0)}}
@keyframes tkdNudge{0%,70%,100%{transform:translateX(0)}80%{transform:translateX(5px)}90%{transform:translateX(0)}}
@media (max-width:420px){.tkd-tk{width:78px;height:54px}.tkd-tk svg{width:78px;height:54px}.tkd-n{left:23px}.tkd-n b{font-size:25px}.tkd-hd{font-size:18.5px}}
@media (prefers-reduced-motion:reduce){.tkd,.tkd-sh,.tkd-tk,.tkd-gr{animation:none}.tkd-sh{display:none}}
`;

export const TICKET_PATH = 'M9 1 H87 A8 8 0 0 1 95 9 V25 A8 8 0 0 0 95 41 V57 A8 8 0 0 1 87 65 H9 A8 8 0 0 1 1 57 V41 A8 8 0 0 0 1 25 V9 A8 8 0 0 1 9 1 Z';

// The viewer's ticket count, or null until it is known. Named is read off the
// stored identity at once, so the right headline paints before the count lands.
export function useMyTickets() {
  const [state, setState] = useState({ named: null, count: null });
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
  }, []);
  return state;
}

export default function TicketDoor({ fig = '', label = 'Challenge a friend', go = 'Send', msg = '', onSend, foot = null, style = null }) {
  const { named, count } = useMyTickets();
  const n = Number.isFinite(count) ? count : 0;
  const head = named === false ? 'Pick a name to earn tickets'
    : `You have ${n} ticket${n === 1 ? '' : 's'} for the ${DRAWING.prizeLabel} drawing`;
  const sub = msg || (named === false
    ? `Name yourself and every new friend you bring in drops a ticket for the ${DRAWING.prizeLabel} drawing.`
    : n === 0
      ? `Your first one is a friend away.${fig ? ` Send your ${fig} and dare them to beat it.` : ' Dare them to beat you.'}`
      : `Every new friend who finishes from your link is one more shot at ${DRAWING.prizeLabel}.`);
  return (
    <section className="tkd" style={style || undefined} aria-label="Challenge a friend">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <span className="tkd-sh" aria-hidden="true" />
      <div className="tkd-top">
        <div className="tkd-tk" aria-hidden="true">
          <svg width="96" height="66" viewBox="0 0 96 66">
            <path d={TICKET_PATH} fill="#fff8e6" stroke="#2a1f04" strokeWidth="2" />
            <line x1="27" y1="7" x2="27" y2="59" stroke="#2a1f04" strokeWidth="2" strokeDasharray="3 4" />
            <text x="14" y="38" textAnchor="middle" fontFamily="inherit" fontSize="9" fontWeight="800" fill="#2a1f04" transform="rotate(-90 14 33)">{DRAWING.prizeLabel}</text>
          </svg>
          <span className="tkd-n"><b>{n}</b><i>TICKETS</i></span>
        </div>
        <div className="tkd-tx">
          <div className="tkd-eb">The {DRAWING.prizeLabel} drawing · ends {DRAWING.endLabel}</div>
          <div className="tkd-hd">{head}</div>
          <div className="tkd-sb" role={msg ? 'status' : undefined}>{sub}</div>
        </div>
      </div>
      <button type="button" className="tkd-go" onClick={onSend}>
        <span className="tkd-gl">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 21V4" /><path d="M4 4h12l-2 4 2 4H4" /></svg>
          {label}
        </span>
        <span className="tkd-gr">{go}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
        </span>
      </button>
      <div className="tkd-ft">{foot || 'One ticket for every new player who finishes a game from your link. No purchase necessary.'}</div>
    </section>
  );
}
