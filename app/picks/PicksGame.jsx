'use client';

// PICKS: the six quick calls in the middle of Price Check (owner, 2026-11-06).
// Played only inside the run (app/pricecheck/PriceCheckClient.jsx), inside its
// RunPlayFrame, so it takes the stage's ink and ground from the --gsx-* vars.
// Rules and scoring live in lib/picks.js; the bank in app/picks/puzzles.js.
//
//   which costs more   tap the pricier of two; the winner stays on top
//   over or under      one item against a round price line
//   tag match          tap a price tag, then the item it belongs to
//
// Every reveal shows both prices, the crowd split (share of players who made
// the right call, /api/quiz/picks-crowd), the gap, and the streak.
// The save is per board (sot_picks_<num>) and resumes mid-leg after a reload.
// One row is filed when the sixth call is made: score 0 to 20, and in
// first_guess the crowd code of what was right (never the score).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PICK_KINDS, PICKS_MAX, STREAK_BONUS_AT, chainOf, gradePicks, rightOf, crowdCode, CALL_IDX } from '@/lib/picks';
import { fmtCents } from '@/lib/price-games';
import { isMobileDevice } from '@/lib/is-mobile';

const SAVE = (num) => `sot_picks_${num}`;
const REC = (num) => `sot_picks_rec_${num}`;
export function readPicksSave(num) {
  try { const s = JSON.parse(localStorage.getItem(SAVE(num)) || 'null'); if (s && s.v === 1 && Array.isArray(s.answers)) return s; } catch (e) {}
  return null;
}
function getAnonId() {
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) {
      a = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('sot_quiz_anon', a);
    }
    return a;
  } catch (e) { return null; }
}
function savedEmail() {
  try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); return id && id.email ? id.email : undefined; } catch (e) { return undefined; }
}
function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

const TITLE = { ab: 'Which costs more?', ou: 'Over or under?', tags: 'Match the tags' };
const freshSave = () => ({ v: 1, answers: [], t0: Date.now(), tEnd: null, status: 'playing' });

function Photo({ item }) {
  const [bad, setBad] = useState(false);
  return (
    <span className={`pk-ph${item.fit === 'contain' ? ' pk-ct' : ''}`}>
      {item.img && !bad ? <img src={item.img} alt="" loading="eager" decoding="async" onError={() => setBad(true)} /> : <i aria-hidden="true">{(item.cat || '').slice(0, 14)}</i>}
    </span>
  );
}

function Card({ item, label, price = false, state = 'idle', onClick = null, badge = null }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={`pk-card pk-${state}`} onClick={onClick || undefined}>
      <Photo item={item} />
      <span className="pk-txt">
        {label ? <span className="pk-lab">{label}</span> : null}
        <span className="pk-name">{item.name}</span>
        <span className="pk-sub">{[item.cat, ...(item.facts || []).slice(0, 1)].filter(Boolean).join(' · ')}</span>
        {price ? <span className="pk-price">{fmtCents(item.price)} <small>{item.asOfShort}</small></span> : null}
      </span>
      {badge ? <span className="pk-badge">{badge}</span> : null}
    </Tag>
  );
}

function CrowdBar({ pct, text }) {
  return (
    <div className="pk-crowd pk-in">
      <div className="pk-crowdt"><span>{text}</span><span>Crowd</span></div>
      <div className="pk-bar"><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default function PicksGame({ day, quizId, num, practice = false, onDone }) {
  const [s, setS] = useState(null);
  const sRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const [sel, setSel] = useState(null);
  const [place, setPlace] = useState({});
  const [crowd, setCrowd] = useState(null);
  const [ending, setEnding] = useState(false);
  const doneRef = useRef(false);
  const chain = useMemo(() => chainOf(day), [day]);

  function commit(n) {
    sRef.current = n; setS(n);
    if (!practice) { try { localStorage.setItem(SAVE(num), JSON.stringify(n)); } catch (e) {} }
  }

  useEffect(() => {
    const saved = practice ? null : readPicksSave(num);
    const base = saved || freshSave();
    sRef.current = base; setS(base);
    if (base.status === 'done' || base.answers.length >= PICK_KINDS.length) { setRevealed(true); finish(base); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    let alive = true;
    fetch(`/api/quiz/picks-crowd?quizId=${encodeURIComponent(quizId)}`).then((r) => r.json())
      .then((d) => { if (alive) setCrowd(d && d.n ? d : { n: 0 }); }).catch(() => { if (alive) setCrowd({ n: 0 }); });
    return () => { alive = false; };
  }, [quizId]);

  function post(fin) {
    if (practice) return;
    try { if (localStorage.getItem(REC(num))) return; localStorage.setItem(REC(num), '1'); } catch (e) {}
    const g = gradePicks(day, fin.answers);
    const el = Math.max(1, Math.round(((fin.tEnd || Date.now()) - (fin.t0 || Date.now())) / 1000));
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, score: g.score, total: PICKS_MAX, correct: g.score, guessesUsed: PICK_KINDS.length, firstGuess: crowdCode(day, fin.answers), timeElapsed: Math.min(36000, el), email: savedEmail(), anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''), circuit: 'pricecheck' }),
      }).catch(() => {});
    } catch (e) {}
  }
  function finish(cur) {
    if (doneRef.current) return;
    doneRef.current = true;
    setEnding(true);
    const fin = cur.status === 'done' ? cur : { ...cur, status: 'done', tEnd: Date.now() };
    if (cur.status !== 'done') { commit(fin); post(fin); }
    const g = gradePicks(day, fin.answers);
    const secs = Math.max(1, Math.round(((fin.tEnd || Date.now()) - (fin.t0 || Date.now())) / 1000));
    setTimeout(() => { try { onDone && onDone({ key: 'picks', score: g.score, best: g.best, answers: fin.answers.slice(), secs, practice }); } catch (e) {} }, 500);
  }

  if (!s) return <div className="pk" style={{ minHeight: 420 }}><style dangerouslySetInnerHTML={{ __html: CSS }} /></div>;

  const answers = s.answers;
  const i = Math.min(PICK_KINDS.length - 1, revealed ? answers.length - 1 : answers.length);
  const kind = PICK_KINDS[i];
  const grade = gradePicks(day, answers);
  const last = grade.per[grade.per.length - 1];
  const settled = s.status === 'done';

  function answer(a) {
    const cur = sRef.current;
    if (revealed || settled || cur.answers.length !== i) return;
    commit({ ...cur, answers: [...cur.answers, a] });
    setRevealed(true);
    vibrate(rightOf(day, i, a) ? [10, 30, 16] : [24]);
  }
  function tapChip(t) { if (revealed) return; setSel(sel === t ? null : t); }
  function tapItem(k) {
    if (revealed) return;
    const p = { ...place };
    if (sel == null) { delete p[k]; setPlace(p); return; }
    for (const x of Object.keys(p)) if (p[x] === sel) delete p[x];
    p[k] = sel; setPlace(p); setSel(null);
  }
  function lockTags() {
    if (Object.keys(place).length < 3) return;
    answer([place[0], place[1], place[2]]);
  }
  function next() {
    if (sRef.current.answers.length >= PICK_KINDS.length) { finish(sRef.current); return; }
    setRevealed(false); setSel(null); setPlace({});
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }

  // The streak meter, six pills, a +1 under the third and sixth.
  const streakNow = grade.streak;
  const doneN = answers.length;

  let body = null, reveal = null;
  const ri = revealed && last ? last : null;
  if (kind === 'ab') {
    const c = chain[i];
    const ans = revealed ? answers[i] : null;
    const st = (side) => (!revealed ? (side === 'top' && i > 0 ? 'held' : 'idle') : c.win === side ? 'win' : 'lose');
    const lab = (side) => {
      const base = i === 0 ? (side === 'top' ? 'Item A' : 'Item B') : (side === 'top' ? 'On top' : 'Challenger');
      return ans === side ? `${base} · your pick` : base;
    };
    body = (
      <div className="pk-pair">
        <Card item={c.top} label={lab('top')} price={revealed || i > 0} state={st('top')} onClick={revealed ? null : () => answer('top')} badge={revealed && c.win === 'top' ? 'Costs more' : null} />
        <Card item={c.bot} label={lab('bot')} price={revealed} state={st('bot')} onClick={revealed ? null : () => answer('bot')} badge={revealed && c.win === 'bot' ? 'Costs more' : null} />
      </div>
    );
    if (revealed) {
      const k = CALL_IDX.indexOf(i);
      const pct = crowd && crowd.n >= 3 && crowd.calls ? crowd.calls[k] : null;
      reveal = (
        <>
          {pct != null ? <CrowdBar pct={pct} text={`${pct}% picked the ${c.winner.name}`} /> : <div className="pk-note pk-in">You are one of the first to make this call today.</div>}
          <div className="pk-gap pk-in2">The {c.winner.name} costs {fmtCents(c.winner.price - c.loser.price)} more.{i < 5 ? ' It stays on top.' : ''}</div>
        </>
      );
    }
  } else if (kind === 'ou') {
    const it = day.ou.item, line = day.ou.line;
    const truth = it.price > line ? 'over' : 'under';
    const bst = (side) => (!revealed ? '' : side === truth ? ' pk-win' : ' pk-lose');
    body = (
      <div className="pk-ou">
        <Card item={it} price={revealed} state={revealed ? 'win' : 'idle'} />
        <div className="pk-line"><small>The line</small><b>{fmtCents(line)}</b></div>
        <div className="pk-two">
          <button type="button" className={`pk-big${bst('under')}`} onClick={() => answer('under')} disabled={revealed}>Under</button>
          <button type="button" className={`pk-big${bst('over')}`} onClick={() => answer('over')} disabled={revealed}>Over</button>
        </div>
      </div>
    );
    if (revealed) {
      const k = CALL_IDX.indexOf(i);
      const pct = crowd && crowd.n >= 3 && crowd.calls ? crowd.calls[k] : null;
      reveal = (
        <>
          {pct != null ? <CrowdBar pct={pct} text={`${pct}% called ${truth}`} /> : <div className="pk-note pk-in">You are one of the first to make this call today.</div>}
          <div className="pk-gap pk-in2">It was {fmtCents(Math.abs(it.price - line))} {truth} the line.</div>
        </>
      );
    }
  } else if (kind === 'tags') {
    const ans = revealed ? answers[i] : null;
    const placed = revealed ? Object.fromEntries((ans || []).map((v, k) => [k, v])) : place;
    const used = new Set(Object.values(placed));
    body = (
      <div className="pk-tags">
        {day.tags.map((it, k) => {
          const has = placed[k] != null;
          const ok = revealed && placed[k] === k;
          return (
            <button key={k} type="button" className={`pk-trow${revealed ? (ok ? ' pk-win' : ' pk-lose') : ''}${!revealed && sel != null ? ' pk-aim' : ''}`} onClick={() => tapItem(k)} disabled={revealed}>
              <Photo item={it} />
              <span className="pk-txt">
                <span className="pk-name">{it.name}</span>
                <span className="pk-sub">{revealed ? (ok ? 'Right' : `It was ${fmtCents(it.price)}`) : (it.cat || '')}</span>
              </span>
              <span className={`pk-slot${has ? ' pk-full' : ''}${revealed && !ok ? ' pk-x' : ''}`}>{has ? fmtCents(day.tags[placed[k]].price) : 'Tag'}</span>
            </button>
          );
        })}
        <div className="pk-hint">{revealed ? 'Each tag in the right place is a point.' : sel != null ? 'Now tap the item it belongs to.' : 'Tap a price tag, then the item it belongs to.'}</div>
        <div className="pk-chips">
          {(day.tagOrder || [0, 1, 2]).map((t) => (
            <button key={t} type="button" className={`pk-chip${sel === t ? ' pk-sel' : ''}${used.has(t) ? ' pk-used' : ''}`} onClick={() => tapChip(t)} disabled={revealed}>{fmtCents(day.tags[t].price)}</button>
          ))}
        </div>
      </div>
    );
    if (revealed) {
      const pct = crowd && crowd.n >= 3 && crowd.tags3 != null ? crowd.tags3 : null;
      reveal = pct != null ? <CrowdBar pct={pct} text={`${pct}% placed all three`} /> : <div className="pk-note pk-in">You are one of the first to match these today.</div>;
    }
  }

  const resultText = ri ? (ri.kind === 'tags' ? (ri.right === 3 ? 'All three, +3' : ri.right ? `${ri.right} of 3, +${ri.right}` : 'None right. Streak resets.') : (ri.right ? 'Right, +3' : 'Missed. Streak resets.')) : '';
  const bonusText = ri && ri.bonus ? 'Streak bonus +1' : (ri && ri.full && STREAK_BONUS_AT.find((n) => n > ri.streak) ? `${STREAK_BONUS_AT.find((n) => n > ri.streak) - ri.streak} more for a bonus` : '');

  return (
    <div className="pk">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pk-head">
        <div className="pk-segs" aria-label={`${doneN} of 6 picks made`}>
          {PICK_KINDS.map((k, n) => <i key={n} className={n < doneN ? 'pk-d' : n === i ? 'pk-c' : ''} />)}
        </div>
        <div className="pk-meta"><span>Pick {i + 1} of 6</span><span>{grade.score} of {PICKS_MAX} pts</span></div>
        <div className="pk-streak">
          <span>Streak {streakNow}</span>
          <span className="pk-pills">
            {PICK_KINDS.map((k, n) => <span key={n}><i className={n < streakNow ? 'pk-on' : ''} /><small>{STREAK_BONUS_AT.includes(n + 1) ? '+1' : ''}</small></span>)}
          </span>
        </div>
      </div>
      {kind !== 'ab' && i > 0 ? (
        <div className="pk-pin"><span>On top: {(chain[i].holder || day.start).name}</span><b>{fmtCents((chain[i].holder || day.start).price)}</b></div>
      ) : null}
      <h2 className="pk-title">{TITLE[kind]}</h2>
      {body}
      {revealed ? (
        <div className="pk-rev">
          {reveal}
          <div className="pk-res pk-in3"><span className={ri && ri.right ? 'pk-ok' : 'pk-no'}>{resultText}</span>{bonusText ? <span>{bonusText}</span> : null}</div>
          <button type="button" className={`pk-go${ending ? ' pk-off' : ''}`} onClick={next} disabled={ending}>{ending ? 'Ringing it up' : answers.length >= PICK_KINDS.length ? 'Finish the picks' : 'Next pick'}</button>
        </div>
      ) : kind === 'tags' ? (
        <button type="button" className={`pk-go${Object.keys(place).length < 3 ? ' pk-off' : ''}`} onClick={lockTags} disabled={Object.keys(place).length < 3}>Lock in</button>
      ) : (
        <div className="pk-hint pk-tap">{kind === 'ab' ? (i === 0 ? 'Tap the one that costs more.' : 'Tap the one that costs more. The winner stays on top.') : 'Is the real price over or under the line?'}</div>
      )}
      <Credits items={kind === 'ab' ? [chain[i].top, chain[i].bot] : kind === 'ou' ? [day.ou.item] : day.tags} />
    </div>
  );
}

function Credits({ items }) {
  const list = items.filter((x) => x && x.credit);
  if (!list.length) return null;
  return (
    <div className="pk-cred">
      {list.map((x, n) => (
        <span key={n}>{x.creditUrl ? <a href={x.creditUrl} target="_blank" rel="noopener noreferrer">{x.credit}</a> : x.credit}</span>
      ))}
    </div>
  );
}

const CSS = `
.pk{--ink:var(--gsx-ink,#08222e);--tile:color-mix(in srgb,var(--gsx-ink,#08222e) 7%,transparent);--card:var(--gsx-card,#ffffff);--cink:var(--gsx-card-ink,var(--gsx-ink,#08222e));--ground:var(--gsx-bg,#cdf5e4);max-width:560px;margin:0 auto;padding:4px 14px 18px;color:var(--ink);font-family:Manrope,system-ui,sans-serif;display:flex;flex-direction:column;gap:10px;box-sizing:border-box}
.pk *{box-sizing:border-box}
@keyframes pkrise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes pkpop{0%{transform:scale(.7);opacity:0}70%{transform:scale(1.06);opacity:1}100%{transform:scale(1)}}
@keyframes pkgrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.pk-in{animation:pkrise .35s ease-out both}.pk-in2{animation:pkrise .35s ease-out .25s both}.pk-in3{animation:pkrise .35s ease-out .45s both}
.pk-head{display:flex;flex-direction:column;gap:6px}
.pk-segs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px}
.pk-segs i{height:6px;border-radius:3px;background:color-mix(in srgb,var(--ink) 15%,transparent);transition:background .3s}
.pk-segs i.pk-d{background:var(--ink)}.pk-segs i.pk-c{background:color-mix(in srgb,var(--ink) 50%,transparent)}
.pk-meta{display:flex;justify-content:space-between;font-size:12px;font-weight:800;font-variant-numeric:tabular-nums}
.pk-streak{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800}
.pk-streak>span:first-child{width:64px;flex:none}
.pk-pills{flex:1;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px}
.pk-pills>span{display:flex;flex-direction:column;align-items:center;gap:1px}
.pk-pills i{display:block;width:100%;height:8px;border-radius:4px;background:color-mix(in srgb,var(--ink) 15%,transparent);transition:background .3s}
.pk-pills i.pk-on{background:var(--ink)}
.pk-pills small{font-size:10px;font-weight:800;height:12px;line-height:12px}
.pk-pin{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border:1px solid var(--ink);border-radius:12px;font-size:12.5px;font-weight:700}
.pk-pin span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-title{margin:2px 0 0;font-size:24px;font-weight:800;letter-spacing:-.01em}
.pk-pair,.pk-ou,.pk-tags{display:flex;flex-direction:column;gap:10px}
.pk-card{display:flex;gap:12px;align-items:center;width:100%;text-align:left;padding:10px;border-radius:18px;border:1px solid var(--ink);background:var(--tile);color:var(--ink);font:inherit;position:relative;transition:transform .15s,opacity .25s,background .25s,border-color .25s}
button.pk-card{cursor:pointer}button.pk-card:active{transform:scale(.985)}
.pk-card.pk-held{border-width:2px;background:var(--card);color:var(--cink)}
.pk-card.pk-win{border-width:3px;background:var(--card);color:var(--cink)}
.pk-card.pk-lose{border-color:color-mix(in srgb,var(--ink) 35%,transparent);background:transparent;opacity:.72}
.pk-ph{width:92px;height:92px;flex:none;border-radius:12px;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center}
.pk-ph img{width:100%;height:100%;object-fit:cover;display:block}
.pk-ph.pk-ct img{object-fit:contain;padding:4px}
.pk-ph i{font-style:normal;font-size:10.5px;font-weight:700;color:#23404f;text-align:center;padding:4px}
.pk-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.pk-lab{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.8}
.pk-name{font-size:16px;font-weight:800;line-height:1.2}
.pk-sub{font-size:12px;font-weight:600;opacity:.8}
.pk-price{font-size:22px;font-weight:800;margin-top:2px;font-variant-numeric:tabular-nums;animation:pkpop .4s ease-out both}
.pk-price small{display:block;font-size:11px;font-weight:700;opacity:.7}
.pk-badge{position:absolute;top:8px;right:8px;padding:4px 8px;border-radius:10px;background:var(--ink);color:var(--ground);font-size:11px;font-weight:800;animation:pkpop .4s ease-out both}
.pk-line{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px;border-radius:16px;background:var(--ink);color:var(--ground)}
.pk-line small{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.pk-line b{font-size:34px;font-weight:800;font-variant-numeric:tabular-nums}
.pk-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.pk-big{height:64px;border-radius:18px;border:1px solid var(--ink);background:var(--tile);color:var(--ink);font:800 20px Manrope,system-ui,sans-serif;cursor:pointer;transition:all .25s}
.pk-big:disabled{cursor:default}
.pk-big.pk-win{border-width:3px;background:var(--card);color:var(--cink)}
.pk-big.pk-lose{opacity:.55;background:transparent}
.pk-trow{display:flex;gap:10px;align-items:center;width:100%;text-align:left;padding:8px 10px;border-radius:16px;border:1px solid var(--ink);background:var(--tile);color:var(--ink);font:inherit;cursor:pointer;transition:all .2s}
.pk-trow .pk-ph{width:56px;height:56px;border-radius:10px}
.pk-trow .pk-name{font-size:14.5px}
.pk-trow.pk-aim{border-width:2px}
.pk-trow.pk-win{border-width:3px;background:var(--card);color:var(--cink)}
.pk-trow.pk-lose{background:transparent}
.pk-trow:disabled{cursor:default}
.pk-slot{flex:none;min-width:84px;text-align:center;padding:8px 10px;border-radius:12px;border:1px solid color-mix(in srgb,var(--ink) 40%,transparent);font-size:15px;font-weight:800;font-variant-numeric:tabular-nums}
.pk-slot.pk-full{background:var(--ink);color:var(--ground);border-color:var(--ink)}
.pk-slot.pk-x{background:transparent;color:var(--ink);text-decoration:line-through;opacity:.7}
.pk-chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.pk-chip{height:52px;border-radius:14px;border:1px solid var(--ink);background:var(--card);color:var(--cink);font:800 16px Manrope,system-ui,sans-serif;cursor:pointer;font-variant-numeric:tabular-nums;transition:all .2s}
.pk-chip.pk-sel{background:var(--ink);color:var(--ground)}
.pk-chip.pk-used{background:transparent;color:var(--ink);opacity:.45}
.pk-chip:disabled{cursor:default}
.pk-hint{font-size:12.5px;font-weight:700;opacity:.85}
.pk-tap{text-align:center;padding:4px 0}
.pk-note{font-size:12.5px;font-weight:700;opacity:.85}
.pk-rev{display:flex;flex-direction:column;gap:8px}
.pk-crowd{display:flex;flex-direction:column;gap:4px}
.pk-crowdt{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;font-weight:800}
.pk-crowdt span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-bar{height:10px;border-radius:5px;background:color-mix(in srgb,var(--ink) 15%,transparent);overflow:hidden}
.pk-bar i{display:block;height:100%;border-radius:5px;background:var(--ink);transform-origin:left center;animation:pkgrow .7s ease-out .25s both}
.pk-gap{font-size:15px;font-weight:800;line-height:1.35}
.pk-res{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-size:13px;font-weight:800}
.pk-ok{padding:4px 10px;border-radius:10px;background:var(--ink);color:var(--ground)}
.pk-no{padding:4px 10px;border-radius:10px;border:1px solid var(--ink)}
.pk-go{width:100%;height:56px;border-radius:28px;border:0;background:var(--ink);color:var(--ground);font:800 17px Manrope,system-ui,sans-serif;cursor:pointer;margin-top:4px}
.pk-go.pk-off{opacity:.35;cursor:default}
.pk-cred{display:flex;flex-wrap:wrap;gap:2px 10px;font-size:10.5px;font-weight:600;opacity:.65;margin-top:2px}
.pk-cred a{color:inherit}
@media(min-width:900px){.pk{padding-top:10px}.pk-title{font-size:28px}}
`;
