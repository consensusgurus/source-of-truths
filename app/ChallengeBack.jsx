'use client';
// THE CHALLENGE CAME BACK (owner, 2026-10-15). Three pieces of the home that
// report the return leg of Challenge a friend (lib/challenge-client.js,
// migration 60). Mock-up: claude.ai/artifact/YJbzZkVJA4KUnkBEX1d6QK.
//
//   ChallengeBack   the card at the top of the home: the newest result a
//                   friend finished that the sender has not seen. Head to head,
//                   the verdict, a ticket dropping in when the friend was a new
//                   player and the drawing is live, then Rematch. The X marks it
//                   seen, so it never comes back for that result.
//   ChallengeRail   the "Your challenges" panel at the top of the right rail.
//   CapTickets      the ticket count in the home's top bar, while the drawing runs.
//
// All three share ONE request (fetchMine memoizes it), all render nothing on
// the server and nothing until there is something to say. Stage tokens only, so
// they follow the light switch; the gold is the challenge door's own.
import { useEffect, useRef, useState } from 'react';
import { fetchMine, finishedTakes, markSeen, seenLocally, challengeTotals } from '@/lib/challenge-client';
import { challengeFig, challengeResult, RUN_CHALLENGES } from '@/lib/challenge';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { DRAWING } from '@/lib/drawing';
import { TICKET_PATH } from './TicketDoor';

const gameOf = (key) => DAILY_GAME_MAP[key] || RUN_CHALLENGES[key] || null;
const gameName = (key) => { const g = gameOf(key); return g ? g.name : 'the puzzle'; };
const gameHref = (key) => { const g = gameOf(key); return g ? (g.href || `/${g.key}`) : '/'; };

function useMine() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    const load = (force) => fetchMine({ force }).then((d) => { if (live) setData(d); });
    load(false);
    const again = () => load(true);
    window.addEventListener('sot:challenge-sent', again);
    return () => { live = false; window.removeEventListener('sot:challenge-sent', again); };
  }, []);
  return data;
}

// Bars report how GOOD each run was: speed on two solves with clocks, else the
// score. The better run fills its bar.
function bars(you, them) {
  if (you && them && you.won && them.won && you.t > 0 && them.t > 0) {
    const best = Math.min(you.t, them.t);
    return [best / you.t, best / them.t];
  }
  const f = (r) => (r && r.o ? r.s / r.o : (r ? Number(r.s) || 0 : 0));
  const a = f(you); const b = f(them); const m = Math.max(a, b) || 1;
  return [a / m, b / m];
}

const CSS = `
.cbk{position:relative;background:var(--stg-raise,#121828);color:var(--stg-ink,#e9edf4);border:1.5px solid #e8b43a;border-radius:16px;
  overflow:hidden;margin:0 0 18px;animation:cbkIn .5s ease-out both;font-family:inherit;}
.cbk-hd{display:flex;align-items:center;gap:10px;background:#e8b43a;color:#2a1f04;padding:8px 10px 8px 16px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;}
.cbk-hd span{flex:1;min-width:0;}
.cbk-x{flex:none;width:32px;height:32px;border:0;border-radius:7px;background:rgba(42,31,4,.14);color:#2a1f04;font:inherit;font-size:18px;font-weight:800;line-height:1;cursor:pointer;}
.cbk-x:focus-visible{outline:2px solid #2a1f04;outline-offset:2px;}
.cbk-bd{display:flex;flex-wrap:wrap;gap:18px 22px;padding:18px 20px;align-items:center;}
.cbk-l{flex:1 1 420px;min-width:260px;display:flex;flex-direction:column;gap:12px;}
.cbk-who{display:flex;align-items:center;gap:12px;}
.cbk-av{flex:none;width:44px;height:44px;border-radius:50%;background:#2563eb;color:#fff;display:grid;place-items:center;font-size:19px;font-weight:800;}
.cbk-t{font-size:21px;font-weight:800;letter-spacing:-.01em;line-height:1.2;}
.cbk-s{font-size:13px;font-weight:600;color:var(--stg-mute,#8b95a8);margin-top:2px;}
.cbk-row{display:grid;grid-template-columns:52px 1fr 64px;align-items:center;gap:10px;}
.cbk-row span{font-size:13px;font-weight:800;}
.cbk-row b{font-size:15px;font-weight:800;text-align:right;font-variant-numeric:tabular-nums;}
.cbk-tr{height:14px;background:var(--stg-line,rgba(255,255,255,.08));border-radius:7px;overflow:hidden;}
.cbk-bar{display:block;height:100%;border-radius:7px;transform-origin:left center;animation:cbkBar .7s cubic-bezier(.2,.8,.3,1) both;}
.cbk-bar.b2{animation-delay:.25s;}
.cbk-v{align-self:flex-start;border-radius:8px;padding:7px 12px;font-size:15px;font-weight:800;color:#0b0f1a;animation:cbkV .45s ease-out .75s both;}
.cbk-r{flex:0 1 260px;min-width:220px;display:flex;flex-direction:column;gap:8px;}
.cbk-go{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border-radius:12px;background:#e8b43a;color:#2a1f04;
  font-size:14.5px;font-weight:800;text-decoration:none;padding:0 14px;text-align:center;}
.cbk-go:hover{filter:brightness(1.08);}
.cbk-g2{display:flex;align-items:center;justify-content:center;min-height:44px;border:1.5px solid var(--stg-line2,rgba(255,255,255,.2));border-radius:12px;
  color:var(--stg-ink,#e9edf4);font-size:13.5px;font-weight:800;text-decoration:none;}
.cbk-g2:hover{border-color:var(--stg-ink2,#aab5c7);}
.cbk-tx{order:3;flex:1 1 100%;display:flex;align-items:center;gap:18px;border:1.5px dashed #c9971f;border-radius:14px;padding:12px 20px;
  min-height:80px;box-sizing:border-box;background:#1c1708;}
.cbk-tk{flex:none;width:78px;height:56px;}
.cbk-tk svg{display:block;animation:cbkDrop .9s cubic-bezier(.3,1.2,.5,1) both;}
.cbk-tt{flex:1;min-width:0;}
.cbk-tt b{display:block;font-size:18px;font-weight:800;letter-spacing:-.01em;color:#f5d27a;}
.cbk-tt i{display:block;font-style:normal;font-size:13px;font-weight:600;color:#c9b98a;margin-top:3px;}
.cbk-tn{flex:none;position:relative;width:72px;text-align:center;border-left:1px solid rgba(201,151,31,.4);padding-left:18px;}
.cbk-tn b{display:block;font-size:32px;font-weight:800;line-height:1;color:#f5d27a;}
.cbk-tn b.pop{animation:cbkPop .5s ease-out both;}
.cbk-tn em{position:absolute;left:18px;right:0;top:-8px;font-style:normal;font-size:13px;font-weight:800;color:var(--stg-good,#6ee7b7);animation:cbkPlus 1.1s ease-out both;}
.cbk-tn i{display:block;font-style:normal;font-size:9px;font-weight:800;letter-spacing:.12em;color:#c9b98a;margin-top:3px;}
.stage-page[data-stage-theme=light] .cbk-tx{background:#fff8e6;}
.stage-page[data-stage-theme=light] .cbk-tt b,.stage-page[data-stage-theme=light] .cbk-tn b{color:#2a1f04;}
.stage-page[data-stage-theme=light] .cbk-tt i,.stage-page[data-stage-theme=light] .cbk-tn i{color:#5f4a12;}
@media (max-width:640px){.cbk{border-radius:0;border-left:0;border-right:0;margin:0}.cbk-bd{padding:14px 16px}.cbk-tx{padding:12px 14px;gap:12px}.cbk-tk{width:60px;height:44px}.cbk-tk svg{width:60px;height:44px}.cbk-tt b{font-size:15px}.cbk-tn{width:52px;padding-left:12px}.cbk-tn b{font-size:26px}}
@keyframes cbkIn{0%{transform:translateY(-16px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes cbkBar{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}
@keyframes cbkV{0%{transform:scale(.85);opacity:0}70%{transform:scale(1.04);opacity:1}100%{transform:scale(1)}}
@keyframes cbkDrop{0%{transform:translate(0,-80px) rotate(-30deg);opacity:0}45%{opacity:1}70%{transform:translate(0,6px) rotate(8deg)}85%{transform:translate(0,-3px) rotate(-3deg)}100%{transform:translate(0,0) rotate(-6deg)}}
@keyframes cbkPlus{0%{transform:translateY(6px) scale(.6);opacity:0}40%{transform:translateY(-4px) scale(1.15);opacity:1}100%{transform:translateY(-24px);opacity:0}}
@keyframes cbkPop{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.cbk,.cbk-bar,.cbk-v,.cbk-tk svg,.cbk-tn b.pop,.cbk-tn em{animation:none}}
.cbr{border:1px solid var(--stg-line,rgba(255,255,255,.11));border-radius:12px;padding:12px 14px;background:var(--stg-surf,rgba(255,255,255,.043));}
.cbr-hd{display:flex;justify-content:space-between;align-items:center;font-size:10.5px;font-weight:800;letter-spacing:.12em;color:var(--stg-mute,#8b95a8);text-transform:uppercase;}
.cbr-hd a{font-size:11.5px;font-weight:800;letter-spacing:0;text-transform:none;color:var(--stg-acc-ink,var(--stg-acc,#7dd3fc));text-decoration:none;}
.cbr-fg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:10px;text-align:center;}
.cbr-fg b{display:block;font-size:18px;font-weight:800;color:var(--stg-ink,#e9edf4);}
.cbr-fg i{display:block;font-style:normal;font-size:9px;font-weight:800;letter-spacing:.1em;color:var(--stg-mute,#8b95a8);text-transform:uppercase;}
.cbr-ln{font-size:12px;font-weight:600;color:var(--stg-mute,#8b95a8);margin-top:10px;line-height:1.4;}
.sty-tix b{color:#e8b43a;}
.stage-page[data-stage-theme=light] .sty-tix b{color:#a97b12;}
`;

export function ChallengeBack() {
  const data = useMine();
  const [gone, setGone] = useState({});
  const [stage, setStage] = useState(0);
  const timers = useRef([]);
  const take = (() => {
    if (!data) return null;
    for (const t of finishedTakes(data)) {
      if (!t.seen && !gone[t.id] && !seenLocally(t.id)) return t;
    }
    return null;
  })();
  const id = take ? take.id : null;
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    setStage(0);
    if (!id) return undefined;
    timers.current = [setTimeout(() => setStage(1), 1300), setTimeout(() => setStage(2), 2200)];
    return () => timers.current.forEach(clearTimeout);
  }, [id]);
  if (!take) return null;

  const key = take.challenge.game;
  const you = take.challenge.fig || {};
  const them = take.fig || {};
  const res = challengeResult(you, them, key) || { res: 'tie', by: '' };
  const [yw, tw] = bars(you, them);
  const name = take.name || 'A friend';
  const verdict = res.res === 'win' ? `You won${res.by ? ' ' + res.by : ''}`
    : res.res === 'loss' ? `${name} beat you${res.by ? ' ' + res.by : ''}` : `Dead level with ${name}`;
  const vBg = res.res === 'win' ? 'var(--stg-good,#6ee7b7)' : res.res === 'loss' ? 'var(--stg-bad,#fb7185)' : '#e8b43a';
  const vInk = 'var(--stg-raise,#0b0f1a)';
  const yCol = res.res === 'loss' ? 'var(--stg-mute2,#78859d)' : 'var(--stg-good,#6ee7b7)';
  const tCol = res.res === 'loss' ? 'var(--stg-bad,#fb7185)' : 'var(--stg-mute2,#78859d)';
  const num = take.challenge.num ? ` No. ${take.challenge.num}` : '';
  const tickets = data && data.drawingLive && data.named && take.newPlayer && Number.isFinite(data.tickets) ? data.tickets : null;
  const close = () => { markSeen([take.id]); setGone((g) => ({ ...g, [take.id]: true })); };
  const later = finishedTakes(data).filter((t) => !t.seen && !gone[t.id] && !seenLocally(t.id)).length - 1;

  return (
    <section className="cbk" aria-label="Challenge result">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cbk-hd">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 21V4" /><path d="M4 4h12l-2 4 2 4H4" /></svg>
        <span>Challenge result · {gameName(key)}{num}{later > 0 ? ` · ${later} more` : ''}</span>
        <button type="button" className="cbk-x" aria-label="Close" onClick={close}>×</button>
      </div>
      <div className="cbk-bd">
        <div className="cbk-l">
          <div className="cbk-who">
            <span className="cbk-av" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
            <div>
              <div className="cbk-t">{name} took your challenge</div>
              <div className="cbk-s">{take.newPlayer ? 'New player · joined through your link' : 'Played your link'}</div>
            </div>
          </div>
          <div className="cbk-row">
            <span>You</span>
            <span className="cbk-tr"><span className="cbk-bar" style={{ width: `${Math.max(6, yw * 100)}%`, background: yCol }} /></span>
            <b>{challengeFig(you, key)}</b>
          </div>
          <div className="cbk-row">
            <span>{name.length > 7 ? name.slice(0, 6) + '…' : name}</span>
            <span className="cbk-tr"><span className="cbk-bar b2" style={{ width: `${Math.max(6, tw * 100)}%`, background: tCol }} /></span>
            <b>{challengeFig(them, key)}</b>
          </div>
          <div className="cbk-v" role="status" style={{ background: vBg, color: vInk }}>{verdict}</div>
        </div>
        {tickets != null ? (
          <div className="cbk-tx">
            <div className="cbk-tk" aria-hidden="true">
              {stage >= 1 ? (
                <svg width="78" height="56" viewBox="0 0 96 66">
                  <path d={TICKET_PATH} fill="#e8b43a" stroke="#2a1f04" strokeWidth="3" />
                  <line x1="27" y1="7" x2="27" y2="59" stroke="#2a1f04" strokeWidth="3" strokeDasharray="4 5" />
                  <text x="61" y="44" textAnchor="middle" fontFamily="inherit" fontSize="26" fontWeight="800" fill="#2a1f04">+1</text>
                </svg>
              ) : null}
            </div>
            <div className="cbk-tt">
              <b>You earned a ticket for the {DRAWING.prizeLabel} drawing</b>
              <i>{name} finished a game from your link, so a ticket went in the drum. Every new friend adds one. Drawn {DRAWING.drawLabel}.</i>
            </div>
            <div className="cbk-tn">
              {stage >= 2 ? <em aria-hidden="true">+1</em> : null}
              <b className={stage >= 2 ? 'pop' : ''}>{stage >= 2 ? tickets : Math.max(0, tickets - 1)}</b>
              <i>TICKETS</i>
            </div>
          </div>
        ) : null}
        <div className="cbk-r">
          <a className="cbk-go" href={gameHref(key)} onClick={() => markSeen([take.id])}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" /></svg>
            {res.res === 'loss' ? `Win it back: rematch ${name}` : `Rematch ${name}: play today’s`}
          </a>
          <a className="cbk-g2" href="/challenges">See all your challenges</a>
        </div>
      </div>
    </section>
  );
}

export function ChallengeRail() {
  const data = useMine();
  if (!data || !data.challenges || !data.challenges.length) return null;
  const t = challengeTotals(data);
  const pending = data.challenges.flatMap((c) => (c.takes || []).filter((k) => !k.finishedAt).map((k) => ({ ...k, c })))[0];
  return (
    <div className="cbr">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cbr-hd">Your challenges<a href="/challenges">See all ›</a></div>
      <div className="cbr-fg">
        <div><b>{t.sent}</b><i>Sent</i></div>
        <div><b>{t.played}</b><i>Played</i></div>
        <div><b style={{ color: 'var(--stg-good,#6ee7b7)' }}>{t.won}–{t.lost}</b><i>Record</i></div>
      </div>
      {pending ? <div className="cbr-ln">{pending.name} opened your {gameName(pending.c.game)} link, still playing.</div>
        : t.sent && !t.opened ? <div className="cbr-ln">Nobody has opened your links yet. Send one to someone who will.</div> : null}
    </div>
  );
}

export function CapTickets() {
  const data = useMine();
  if (!data || !data.drawingLive || !data.named || !Number.isFinite(data.tickets)) return null;
  return (
    <a className="sty-fc sty-fca sty-tix" href="/challenges" title={`Your tickets for the ${DRAWING.prizeLabel} drawing`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <b>{data.tickets}</b>
      <i>{data.tickets === 1 ? 'Ticket' : 'Tickets'}</i>
    </a>
  );
}
