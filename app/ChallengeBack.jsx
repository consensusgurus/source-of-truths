'use client';
// THE CHALLENGE CAME BACK (owner, 2026-10-15). Three pieces of the home that
// report the return leg of Challenge a friend (lib/challenge-client.js,
// migration 60). Mock-up: claude.ai/artifact/YJbzZkVJA4KUnkBEX1d6QK.
//
//   ChallengeBack   the card at the top of the home: the newest result a
//                   friend finished that the sender has not seen. Head to head,
//                   the verdict, a ticket dropping in when the friend was a new
//                   player and the drawing is live, then a dare on the most similar game. The X marks it
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
import { DAILY_GAME_MAP, familyAfter, liveDailyKeys } from '@/lib/daily-games';
import { withRef } from '@/lib/referrals';
import { useUnplayedSimilar } from './useNextUnplayed';
import { DRAWING, formatTickets } from '@/lib/drawing';
import { TICKET_PATH } from './TicketDoor';

const gameOf = (key) => DAILY_GAME_MAP[key] || RUN_CHALLENGES[key] || null;
const gameName = (key) => { const g = gameOf(key); return g ? g.name : 'the puzzle'; };
const gameHref = (key) => { const g = gameOf(key); return g ? (g.href || `/${g.key}`) : '/'; };

// THE NEXT DARE IS THE MOST SIMILAR GAME (owner, 2026-10-22). The friend
// already played this board, so sending them back to it is no dare at all:
// the card offers the closest game instead. A daily: the first UNPLAYED
// similar daily (family, then category), else the closest one regardless. A
// run: another run of the same kind.
function staticSimilar(key) {
  if (RUN_CHALLENGES[key]) {
    const all = Object.values(RUN_CHALLENGES).filter((r) => r.key !== key);
    return all.find((r) => r.cat === RUN_CHALLENGES[key].cat) || all[0] || null;
  }
  const live = liveDailyKeys();
  const fam = familyAfter(key).find((k) => live.includes(k));
  if (fam) return DAILY_GAME_MAP[fam];
  const mine = DAILY_GAME_MAP[key];
  const k = live.find((x) => x !== key && mine && DAILY_GAME_MAP[x] && DAILY_GAME_MAP[x].cat === mine.cat);
  return k ? DAILY_GAME_MAP[k] : null;
}
function useSimilar(key) {
  const isDaily = !!(key && DAILY_GAME_MAP[key]);
  const list = useUnplayedSimilar({ self: key, active: isDaily, count: 1 });
  const first = list && list[0];
  if (first && first.key && !first.quiz) return first;
  return key ? staticSimilar(key) : null;
}

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
.cbk{--cbk-gold:#f5c84c;--cbk-goldbg:rgba(245,200,76,.08);position:relative;background:var(--stg-raise,#ffffff);color:var(--stg-ink,#0b0d12);border:1px solid var(--stg-line,rgba(11,15,26,.14));border-radius:14px;
  overflow:hidden;margin:0 0 18px;animation:cbkIn .5s ease-out both;font-family:inherit;}
html:not([data-stage-boot='dark']) .stage-page[data-stage-theme='light'] .cbk{--cbk-gold:#8a5a00;--cbk-goldbg:#fdf6e3;}
.cbk-hd{display:flex;align-items:center;gap:10px;background:transparent;color:var(--cbk-gold);border-bottom:1px solid var(--stg-line,rgba(11,15,26,.14));padding:6px 8px 6px 16px;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;}
.cbk-hd span{flex:1;min-width:0;}
.cbk-x{flex:none;width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:var(--stg-mute,#5f6774);font:inherit;font-size:18px;font-weight:800;line-height:1;cursor:pointer;}
.cbk-x:hover{background:var(--stg-surf2,rgba(11,13,18,.07));color:var(--stg-ink,#0b0d12);}
.cbk-x:focus-visible{outline:2px solid var(--stg-ink,#0b0d12);outline-offset:2px;}
.cbk-bd{display:flex;flex-wrap:wrap;gap:16px 22px;padding:16px 20px 18px;align-items:center;}
.cbk-l{flex:1 1 420px;min-width:260px;display:flex;flex-direction:column;gap:12px;}
.cbk-who{display:flex;align-items:center;gap:12px;}
.cbk-av{flex:none;width:40px;height:40px;border-radius:50%;background:var(--stg-ink,#0b0d12);color:var(--stg-raise,#ffffff);display:grid;place-items:center;font-size:17px;font-weight:800;}
.cbk-t{font-size:20px;font-weight:800;letter-spacing:-.01em;line-height:1.2;padding-bottom:.08em;}
.cbk-s{font-size:13px;font-weight:600;color:var(--stg-mute,#5f6774);margin-top:2px;}
.cbk-row{display:grid;grid-template-columns:min(124px,34%) 1fr 64px;align-items:center;gap:10px;}
.cbk-row span{font-size:13px;font-weight:800;}
.cbk-row .cbk-nm{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.16em;margin-bottom:-.16em;}
.cbk-row b{font-size:15px;font-weight:800;text-align:right;font-variant-numeric:tabular-nums;}
.cbk-tr{height:10px;background:var(--stg-surf2,rgba(11,13,18,.07));border-radius:5px;overflow:hidden;}
.cbk-bar{display:block;height:100%;border-radius:5px;transform-origin:left center;animation:cbkBar .7s cubic-bezier(.2,.8,.3,1) both;}
.cbk-bar.b2{animation-delay:.25s;}
.cbk-v{align-self:flex-start;border-radius:8px;padding:6px 12px;font-size:14px;font-weight:800;border:1px solid currentColor;animation:cbkV .45s ease-out .75s both;}
.cbk-r{flex:0 1 260px;min-width:220px;display:flex;flex-direction:column;gap:8px;}
.cbk-go{display:flex;align-items:center;justify-content:center;gap:8px;min-height:46px;border-radius:10px;background:var(--stg-ink,#0b0d12);color:var(--stg-raise,#ffffff);
  font-size:14px;font-weight:800;text-decoration:none;padding:0 14px;text-align:center;}
.cbk-go{border:0;font-family:inherit;cursor:pointer;width:100%;}
.cbk-go:hover{opacity:.88;}
.cbk-g3{text-align:center;font-size:13px;font-weight:700;color:var(--stg-mute,#5f6774);text-decoration:underline;text-underline-offset:3px;}
.cbk-u{font-size:12px;word-break:break-all;color:var(--stg-mute,#5f6774);}
.cbk-two{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.cbk-two.one{grid-template-columns:1fr;}
.cbk-g2{display:flex;align-items:center;justify-content:center;text-align:center;padding:0 8px;min-height:42px;border:1.5px solid var(--stg-ink,#0b0d12);border-radius:10px;
  color:var(--stg-ink,#0b0d12);font-size:13px;font-weight:800;text-decoration:none;}
.cbk-g2:hover{background:var(--stg-surf2,rgba(11,13,18,.07));}
.cbk-tx{order:3;flex:1 1 100%;display:flex;align-items:center;gap:18px;border:1px solid var(--stg-line,rgba(11,15,26,.14));border-radius:12px;padding:12px 20px;
  min-height:76px;box-sizing:border-box;background:var(--cbk-goldbg);}
.cbk-tk{flex:none;width:78px;height:56px;}
.cbk-tk svg{display:block;animation:cbkDrop .9s cubic-bezier(.3,1.2,.5,1) both;}
.cbk-tt{flex:1;min-width:0;}
.cbk-tt b{display:block;font-size:17px;font-weight:800;letter-spacing:-.01em;color:var(--stg-ink,#0b0d12);}
.cbk-tt i{display:block;font-style:normal;font-size:13px;font-weight:600;color:var(--stg-ink2,#3f4757);margin-top:3px;}
.cbk-tn{flex:none;position:relative;min-width:72px;text-align:center;border-left:1px solid var(--stg-line,rgba(11,15,26,.14));padding-left:18px;}
.cbk-tn b{display:block;font-size:30px;font-weight:800;line-height:1;color:var(--cbk-gold);white-space:nowrap;font-variant-numeric:tabular-nums;}
.cbk-tn b.pop{animation:cbkPop .5s ease-out both;}
.cbk-tn em{position:absolute;left:18px;right:0;top:-8px;font-style:normal;font-size:13px;font-weight:800;color:var(--stg-good,#047857);animation:cbkPlus 1.1s ease-out both;}
.cbk-tn i{display:block;font-style:normal;font-size:9px;font-weight:800;letter-spacing:.12em;color:var(--stg-mute,#5f6774);margin-top:3px;}
@media (max-width:640px){.cbk{border-radius:0;border-left:0;border-right:0;margin:0}.cbk-bd{padding:14px 16px;gap:14px}.cbk-l,.cbk-r{flex:1 1 100%;min-width:0}.cbk-v{align-self:stretch;text-align:center}.cbk-tx{padding:12px 14px;gap:12px}.cbk-tk{width:60px;height:44px}.cbk-tk svg{width:60px;height:44px}.cbk-tt b{font-size:15px}.cbk-tn{min-width:52px;padding-left:12px}.cbk-tn b{font-size:24px}}
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
  const sim = useSimilar(take ? take.challenge.game : null);
  const [sent, setSent] = useState('');
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
  // NEW PALETTE (owner, 2026-10-28): colour as a soft tint with its own ink,
  // never a solid saturated fill. The better run's bar is ink, the other grey.
  const vInk = res.res === 'win' ? 'var(--stg-good,#047857)' : res.res === 'loss' ? 'var(--stg-bad,#be123c)' : 'var(--cbk-gold)';
  const vBg = `color-mix(in srgb, ${vInk} 10%, var(--stg-raise,#ffffff))`;
  const yCol = res.res === 'loss' ? 'var(--stg-mute2,#9aa3b2)' : 'var(--stg-ink,#0b0d12)';
  const tCol = res.res === 'loss' ? 'var(--stg-ink,#0b0d12)' : 'var(--stg-mute2,#9aa3b2)';
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
            <span className="cbk-nm">You</span>
            <span className="cbk-tr"><span className="cbk-bar" style={{ width: `${Math.max(6, yw * 100)}%`, background: yCol }} /></span>
            <b>{challengeFig(you, key)}</b>
          </div>
          <div className="cbk-row">
            <span className="cbk-nm" title={name}>{name}</span>
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
                  <path d={TICKET_PATH} fill="#f5d27a" stroke="#0b0d12" strokeWidth="3" />
                                    <text x="61" y="44" textAnchor="middle" fontFamily="inherit" fontSize="26" fontWeight="800" fill="#0b0d12">+2</text>
                </svg>
              ) : null}
            </div>
            <div className="cbk-tt">
              <b>You earned two tickets for the {DRAWING.prizeLabel} drawing</b>
              <i>{name} finished a game from your link, so two tickets went in the drum. Every new friend adds two. Drawn {DRAWING.drawLabel}.</i>
            </div>
            <div className="cbk-tn">
              {stage >= 2 ? <em aria-hidden="true">+2</em> : null}
              <b className={stage >= 2 ? 'pop' : ''}>{formatTickets(stage >= 2 ? tickets : Math.max(0, tickets - DRAWING.friendTickets))}</b>
              <i>TICKETS</i>
            </div>
          </div>
        ) : null}
        <div className="cbk-r">
          {sim ? (
            <button type="button" className="cbk-go" onClick={() => {
              markSeen([take.id]);
              const url = withRef(`${window.location.origin}${sim.href || '/' + sim.key}`);
              const text = `${res.res === 'loss' ? 'You got me on ' + gameName(key) + '. ' : ''}Try ${sim.name} next on Mind Loft.`;
              let touch = false;
              try { touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { touch = false; }
              const copy = () => { try { navigator.clipboard.writeText(`${text} ${url}`).then(() => setSent('Link copied'), () => setSent(url)); } catch (e) { setSent(url); } };
              if (touch && navigator.share) navigator.share({ text, url }).catch(() => {}); else copy();
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 21V4" /><path d="M4 4h12l-2 4 2 4H4" /></svg>
              {sent === 'Link copied' ? 'Link copied. Paste it to ' + name : `Challenge ${name} to ${sim.name}`}
            </button>
          ) : null}
          {sent && sent !== 'Link copied' ? <div className="cbk-u">{sent}</div> : null}
          <div className={'cbk-two' + (sim ? '' : ' one')}>
            {sim ? <a className="cbk-g2" href={sim.href || `/${sim.key}`} onClick={() => markSeen([take.id])}>Play {sim.name} first</a> : null}
            <a className="cbk-g2" href="/challenges">All challenges</a>
          </div>
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
    <a className="sty-fc sty-fca sty-tix" href="/quizzes/community#drawing" title={`Your tickets for the ${DRAWING.prizeLabel} drawing`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <b>{formatTickets(data.tickets)}</b>
      <i>{data.tickets === 1 ? 'Ticket' : 'Tickets'}</i>
    </a>
  );
}
