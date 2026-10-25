'use client';

// POLYMATH (owner, 2026-10-19): the day's three gauntlets read as one title.
// Built from the approved mockups (canvas "Polymath", Page and PagePhone).
// Every figure comes from /api/quiz/polymath, which joins the three circuit
// boards; this device's own run saves fill in a leg whose row is still in
// flight, so a player who just finished never sees a stale meter.
import { useEffect, useMemo, useState } from 'react';
import CircuitFrame from '../circuits/CircuitFrame';
import TicketDoor from '../TicketDoor';
import { dailyMeIdentity } from '../dailyMeClient';
import { resultPostsSettled } from '../ResultQueue';
import { drawingIsLive } from '@/lib/drawing';
import { withRef } from '@/lib/referrals';
import { categoryColor, categoryColorLight } from '@/lib/category-ramp';
import {
  POLY_LEGS, POLY_TIERS, legPoints, polyScore, tierFor, tierRange, legTitle,
  localLeg, etToday, shareQuery,
} from '@/lib/polymath';

const fmtClock = (s) => {
  const n = Math.max(0, Math.round(Number(s) || 0));
  const m = Math.floor(n / 60);
  return `${m}:${String(n % 60).padStart(2, '0')}`;
};

const LIGHT = "html:not([data-stage-boot='dark']) .cfr[data-stage-theme='light']";

const CSS = `
.pm{display:flex;flex-direction:column;gap:22px;padding:22px 0 40px;font-variant-numeric:tabular-nums;}
.pm-head{display:flex;flex-direction:column;gap:6px;}
.pm-eb{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-acc);}
.pm-h1{margin:0;font-size:44px;font-weight:800;letter-spacing:-.03em;line-height:1.05;color:var(--stg-ink);}
.pm-lede{margin:0;font-size:16px;line-height:1.5;color:var(--stg-ink2);max-width:640px;}
.pm-shared{border:1.5px dashed var(--stg-line2,var(--stg-line));border-radius:12px;padding:12px 14px;font-size:14px;font-weight:700;color:var(--stg-ink);}
.pm-shared b{font-weight:800;}
.pm-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:22px;align-items:start;}
.pm-col{display:flex;flex-direction:column;gap:22px;min-width:0;}
.pm-hero{border-radius:16px;padding:20px 22px;display:flex;flex-direction:column;gap:8px;color:#0b0d12;min-height:150px;box-sizing:border-box;}
.pm-hero.wait{background:var(--stg-surf);color:var(--stg-ink);border:1px solid var(--stg-line);}
.pm-hl{font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;}
.pm-hrow{display:flex;justify-content:space-between;align-items:baseline;gap:16px;}
.pm-hname{font-size:38px;font-weight:800;letter-spacing:-.02em;line-height:1.05;}
.pm-hnum{font-size:38px;font-weight:800;min-width:2.4ch;text-align:right;}
.pm-hsub{font-size:14px;font-weight:700;}
.pm-bar{height:8px;border-radius:4px;background:rgba(11,13,18,.18);overflow:hidden;}
.pm-hero.wait .pm-bar{background:var(--stg-line);}
.pm-bar i{display:block;height:100%;background:#0b0d12;border-radius:4px;}
.pm-hero.wait .pm-bar i{background:var(--stg-acc);}
.pm-card{background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:16px;overflow:hidden;}
.pm-ch{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:14px 18px;border-bottom:1px solid var(--stg-line);}
.pm-ch h2{margin:0;font-size:17px;font-weight:800;color:var(--stg-ink);}
.pm-ch span{font-size:12px;font-weight:700;color:var(--stg-mute);}
.pm-leg{display:grid;grid-template-columns:6px minmax(0,1fr) auto;gap:14px;align-items:center;padding:13px 18px 13px 0;border-bottom:1px solid var(--stg-line);min-height:64px;box-sizing:border-box;}
.pm-leg:last-child{border-bottom:0;}
.pm-rule{align-self:stretch;background:var(--lh);}
${LIGHT} .pm-rule{background:var(--lhl);}
.pm-ln{display:flex;flex-direction:column;gap:2px;min-width:0;}
.pm-ln small{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-mute);}
.pm-ln b{font-size:16px;font-weight:800;color:var(--stg-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.16em;margin-bottom:-.16em;}
.pm-lp{font-size:24px;font-weight:800;color:var(--stg-ink);min-width:2.4ch;text-align:right;}
.pm-play{display:inline-flex;align-items:center;justify-content:center;height:38px;padding:0 14px;border-radius:10px;
  background:#7dd3fc;color:#08222e;font-weight:800;font-size:13.5px;text-decoration:none;white-space:nowrap;}
.pm-play:hover{filter:brightness(1.06);}
.pm-play:focus-visible{outline:2px solid var(--stg-ink);outline-offset:2px;}
.pm-ladder{display:flex;flex-direction:column-reverse;gap:7px;padding:16px 18px;}
.pm-rung{height:44px;box-sizing:border-box;border-radius:10px;border:2px solid var(--tc);padding:0 13px;display:flex;align-items:center;justify-content:space-between;color:var(--stg-ink);}
.pm-rung b{font-size:15px;font-weight:800;}
.pm-rung span{font-size:12px;font-weight:700;color:var(--stg-ink2);}
.pm-rung.on{background:var(--tc);color:#0b0d12;}
.pm-rung.on span{color:#0b0d12;}
.pm-rung.on b::after{content:'  You';font-size:11px;letter-spacing:.1em;text-transform:uppercase;}
.pm-brow{display:grid;grid-template-columns:34px minmax(0,1fr) auto 40px;gap:10px;align-items:center;padding:10px 18px;border-bottom:1px solid var(--stg-line);font-size:14px;color:var(--stg-ink);}
.pm-brow.me{background:color-mix(in srgb,var(--stg-acc) 14%,transparent);}
.pm-brow .rk{font-weight:800;}
.pm-brow .nm{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.16em;margin-bottom:-.16em;}
.pm-brow .nm small{display:block;font-size:11px;font-weight:700;color:var(--stg-mute);}
.pm-brow .sc{font-weight:800;font-size:15px;text-align:right;}
.pm-pill{padding:3px 8px;border-radius:999px;background:var(--tc);color:#0b0d12;font-size:11px;font-weight:800;white-space:nowrap;}
.pm-bmsg{padding:18px;font-size:14px;font-weight:600;color:var(--stg-ink2);min-height:24px;}
.pm-more{all:unset;box-sizing:border-box;display:block;width:100%;text-align:center;padding:13px;cursor:pointer;color:var(--stg-acc);font-weight:800;font-size:14px;}
.pm-more:focus-visible{outline:2px solid var(--stg-acc);outline-offset:-2px;}
.pm-how{padding:16px 18px;display:flex;flex-direction:column;gap:8px;}
.pm-how small{font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--stg-mute);}
.pm-how p{margin:0;font-size:14px;line-height:1.55;color:var(--stg-ink2);}
.pm-acts{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;}
.pm-back{display:inline-flex;align-items:center;gap:6px;color:var(--stg-ink);font-weight:800;font-size:14px;text-decoration:none;}
.pm-back:hover{text-decoration:underline;text-underline-offset:3px;}
.pm-share{display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 20px;border-radius:12px;border:0;cursor:pointer;
  background:var(--stg-ink);color:var(--stg-ground,#0b0f1a);font:inherit;font-weight:800;font-size:15px;}
.pm-share:focus-visible{outline:2px solid var(--stg-acc);outline-offset:3px;}
.pm-chal{border-radius:16px;background:#0369a1;color:#fff;padding:16px;display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center;}
.pm-chal b{font-size:17px;font-weight:800;}
.pm-chal span{font-size:13px;font-weight:600;}
.pm-chal button{width:100%;height:46px;border-radius:10px;border:0;background:#fff;color:#0369a1;font:inherit;font-weight:800;font-size:14px;cursor:pointer;}
@media (max-width:900px){
  .pm-grid{grid-template-columns:minmax(0,1fr);}
  .pm-h1{font-size:38px;}
}
@media (max-width:560px){
  .pm{gap:16px;padding-top:16px;}
  .pm-hero{border-radius:0;margin:0 -16px;}
  .pm-card{border-radius:0;margin:0 -16px;border-left:0;border-right:0;}
  .pm-hname,.pm-hnum{font-size:32px;}
}
`;

function legHue(l) {
  return { '--lh': categoryColor(l.cat), '--lhl': categoryColorLight(l.cat) };
}

export default function PolymathClient({ dateLabel = '', shared = null }) {
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');
  const [local, setLocal] = useState(null);
  const [all, setAll] = useState(false);
  const [draw, setDraw] = useState(false);
  const [msg, setMsg] = useState('');
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    setDraw(drawingIsLive());
    const day = etToday();
    setLocal(POLY_LEGS.map((l) => localLeg(l.id, day)));
    let alive = true;
    resultPostsSettled().then(() => {
      const { anonId, email } = dailyMeIdentity();
      const qs = new URLSearchParams({ fresh: '1' });
      if (anonId) qs.set('anonId', anonId);
      if (email) qs.set('email', email);
      fetch(`/api/quiz/polymath?${qs.toString()}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => { if (!alive) return; if (d && d.legs) { setData(d); setState('ready'); } else setState('error'); })
        .catch(() => { if (alive) setState('error'); });
    });
    return () => { alive = false; };
  }, []);

  // The viewer's three legs: the server's, with this device's finished runs
  // filling any leg whose rows have not reached the board yet.
  const legs = useMemo(() => POLY_LEGS.map((l, i) => {
    const sv = data && data.me && data.me.legs ? data.me.legs[i] : null;
    const lc = local ? local[i] : null;
    let st = sv ? sv.state : 'none';
    let right = sv ? sv.right : 0;
    if (lc && lc.state === 'done' && st !== 'done') { st = 'done'; right = lc.right; }
    else if (lc && lc.state === 'started' && st === 'none') { st = 'started'; right = lc.right; }
    return { ...l, state: st, right, points: st === 'done' ? legPoints(l.id, right) : null, title: st === 'done' ? legTitle(l.id, right) : '' };
  }), [data, local]);
  const done = legs.filter((x) => x.state === 'done').length;
  const score = done === legs.length ? polyScore(legs.map((x) => x.points)) : null;
  const tier = score == null ? null : tierFor(score);
  const serverDone = !!(data && data.me && data.me.score != null);
  const rank = serverDone ? data.me.rank : null;
  const field = data ? data.field : 0;
  const next = legs.find((x) => x.state !== 'done') || null;

  const board = (data && data.board) || [];
  const meKey = data && data.me ? data.me.userKey : null;
  const shown = all ? board : board.slice(0, 10);
  const meOff = meKey && rank && !shown.some((r) => r.userKey === meKey);

  const shareUrl = () => {
    const q = shareQuery(legs.map((x) => x.points), score, etToday());
    return withRef(`${window.location.origin}/polymath?${q}`);
  };
  const shareText = () => {
    const parts = legs.map((x) => `${x.short} ${x.points == null ? '–' : x.points}`).join(' · ');
    const head = tier ? `Polymath, ${dateLabel}: ${tier.name}, ${score}` : `Polymath, ${dateLabel}: ${done} of 3 played`;
    return `${head}\n${parts}`;
  };
  const sendOrCopy = (text, url, done2) => {
    let touch = false;
    try { touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { touch = false; }
    if (touch && navigator.share) { navigator.share({ text, url }).catch(() => {}); return; }
    try { navigator.clipboard.writeText(`${text}\n${url}`).then(() => done2('Copied. Paste it anywhere.'), () => done2(url)); }
    catch (e) { done2(url); }
  };
  const share = () => sendOrCopy(shareText(), shareUrl(), setShareMsg);
  const challenge = () => {
    const text = tier ? `Can you beat my ${tier.name} (${score}) on today's Polymath?` : 'Play today’s Polymath with me: Trivia, Math and English Gauntlets, one title.';
    sendOrCopy(text, shareUrl(), (m) => setMsg(m.startsWith('Copied') ? 'Link copied. Paste it to a friend.' : m));
  };

  const heroStyle = tier ? { background: tier.colour } : undefined;
  const barPct = tier ? (tier.next ? Math.round(((score - tier.min) / (tier.next.min - tier.min)) * 100) : 100) : Math.round((done / 3) * 100);

  return (
    <CircuitFrame label="Polymath" wide>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pm">
        <div className="pm-head">
          <span className="pm-eb">Polymath{dateLabel ? ` · ${dateLabel}` : ''}</span>
          <h1 className="pm-h1">Polymath</h1>
          <p className="pm-lede">The day&rsquo;s Trivia, Math and English Gauntlets, each counting a third. One title for all three.</p>
        </div>

        {shared && shared.score != null ? (
          <div className="pm-shared">A friend shared <b>{tierFor(shared.score).name}, {shared.score}</b>
            {shared.points ? ` (${POLY_LEGS.map((l, i) => `${l.short} ${shared.points[i] == null ? '–' : shared.points[i]}`).join(' · ')})` : ''}. Can you beat it?</div>
        ) : null}

        <div className="pm-grid">
          <div className="pm-col">
            <div className={'pm-hero' + (tier ? '' : ' wait')} style={heroStyle}>
              <span className="pm-hl">{tier ? 'Your title today' : 'Your Polymath today'}</span>
              <div className="pm-hrow">
                <span className="pm-hname">{tier ? tier.name : `${done} of 3 played`}</span>
                <span className="pm-hnum">{tier ? score : ''}</span>
              </div>
              <span className="pm-hsub">
                {tier
                  ? [rank ? `#${rank} of ${Math.max(field, rank)}${data.me.provisional ? ' if you claim a name' : ''}` : (state === 'loading' ? 'Reading the board' : null),
                    tier.next ? `${tier.toNext} point${tier.toNext === 1 ? '' : 's'} to ${tier.next.name}` : 'The top of the ladder'].filter(Boolean).join(' · ')
                  : next ? `Next: the ${next.name}` : ''}
              </span>
              <div className="pm-bar"><i style={{ width: `${Math.max(3, barPct)}%` }} /></div>
            </div>

            <section className="pm-card" aria-label="Your three gauntlets">
              <div className="pm-ch"><h2>Your three gauntlets</h2><span>Each scored 0 to 100</span></div>
              {legs.map((l) => (
                <div key={l.id} className="pm-leg" style={legHue(l)}>
                  <span className="pm-rule" aria-hidden="true" />
                  <div className="pm-ln">
                    <small>{l.name}</small>
                    <b>{l.state === 'done' ? l.title : l.state === 'started' ? 'Under way' : 'Not played yet'}</b>
                  </div>
                  {l.state === 'done'
                    ? <span className="pm-lp">{l.points}</span>
                    : <a className="pm-play" href={l.href}>{l.state === 'started' ? 'Resume' : `Play ${l.short}`}</a>}
                </div>
              ))}
            </section>

            <section className="pm-card" aria-label="Today's Polymath board">
              <div className="pm-ch"><h2>Today&rsquo;s board</h2><span>{field ? `${field} played all three` : 'All three played'}</span></div>
              {state === 'loading' ? <div className="pm-bmsg">Reading the board.</div>
                : state === 'error' ? <div className="pm-bmsg">The board could not be loaded just now.</div>
                  : !board.length ? <div className="pm-bmsg">Nobody has finished all three today yet. Be the first.</div>
                    : (
                      <>
                        {shown.map((r) => {
                          const t = tierFor(r.score);
                          return (
                            <div key={r.userKey} className={'pm-brow' + (r.userKey === meKey ? ' me' : '')}>
                              <span className="rk">{r.rank}</span>
                              <span className="nm">{r.userKey === meKey ? 'You' : r.username}<small>{r.points.join(' · ')} · {fmtClock(r.time)}</small></span>
                              <span className="pm-pill" style={{ '--tc': t.colour }}>{t.name}</span>
                              <span className="sc">{r.score}</span>
                            </div>
                          );
                        })}
                        {meOff ? (
                          <div className="pm-brow me">
                            <span className="rk">{rank}</span>
                            <span className="nm">You</span>
                            <span className="pm-pill" style={{ '--tc': tier.colour }}>{tier.name}</span>
                            <span className="sc">{score}</span>
                          </div>
                        ) : null}
                        {board.length > 10 ? (
                          <button type="button" className="pm-more" onClick={() => setAll((v) => !v)}>{all ? 'Show the top ten' : 'See the full board'}</button>
                        ) : null}
                      </>
                    )}
            </section>
          </div>

          <div className="pm-col">
            <section className="pm-card" aria-label="The ladder">
              <div className="pm-ch"><h2>The ladder</h2><span>By Polymath score</span></div>
              <div className="pm-ladder">
                {POLY_TIERS.map((t, i) => (
                  <div key={t.name} className={'pm-rung' + (tier && tier.index === i ? ' on' : '')} style={{ '--tc': t.colour }} title={t.line}>
                    <b>{t.name}</b><span>{tierRange(i)}</span>
                  </div>
                ))}
              </div>
            </section>

            {draw ? (
              <TicketDoor fig={tier ? `${tier.name}, ${score}` : ''} label={tier ? `Challenge a friend to beat ${tier.name}` : 'Challenge a friend'}
                go={msg.startsWith('Link copied') ? 'Copied' : 'Send link'} game="Polymath" msg={msg} onSend={challenge}
                foot="Two tickets for every new player who finishes from your link. No purchase necessary." />
            ) : (
              <div className="pm-chal">
                <b>{tier ? `Challenge a friend to beat ${tier.name}` : 'Challenge a friend'}</b>
                <span>{msg || 'Send them today’s three gauntlets.'}</span>
                <button type="button" onClick={challenge}>Send a challenge</button>
              </div>
            )}

            <section className="pm-card">
              <div className="pm-how">
                <small>How the score works</small>
                <p>Each gauntlet scores 0 to 100 against its top title&rsquo;s mark ({POLY_LEGS.map((l) => `${l.mark} on ${l.short}`).join(', ')}). The Polymath score is the average of the three, and the combined clock breaks ties. You take a place on the board once all three are finished.</p>
              </div>
            </section>
          </div>
        </div>

        <div className="pm-acts">
          <a className="pm-back" href="/"><span aria-hidden="true">&larr;</span> Return to all daily puzzles</a>
          <button type="button" className="pm-share" onClick={share}>{shareMsg && shareMsg.startsWith('Copied') ? 'Copied' : 'Share your score'}</button>
        </div>
      </div>
    </CircuitFrame>
  );
}
