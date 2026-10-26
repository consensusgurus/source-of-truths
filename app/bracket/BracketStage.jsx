'use client';

// BRACKET ON THE STAGE (owner, 2026-10-24): on a phone the bracket plays one
// matchup at a time on the full-screen pastel ground. The next matchup peeks in
// ABOVE the current one and the last pick peeks BELOW, and the stack slides down
// as you go. When a round is done its winners pair up into the next round, the
// final crowns a champion, the sheet locks, and all the results land at once
// before the page's own finish (the iris and the end card) takes over.
//
// The host owns the picks and the scoring. This component only draws, keeps
// its own view state (which matchup is on screen, which beat is playing), and
// calls back: onPick to set a winner, onLock to hand the sheet in (the result is
// posted then), onDone once the reveal has played.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RAMP_INK, softGround } from '@/lib/category-ramp';
import { useStageLook, stagePalette, useStageChrome } from '../GauntletScreens';
import { nextMainLook } from '@/lib/stage-look';
import StageTopBar from '../StageTopBar';

const RNAME = (r, rounds) => {
  const left = rounds - r;
  if (left === 1) return 'Final';
  if (left === 2) return 'Semifinals';
  if (left === 3) return 'Quarterfinals';
  if (left === 4) return 'Round of 16';
  return 'Round of 32';
};
const RSHORT = (r, rounds) => {
  const left = rounds - r;
  if (left === 1) return 'Final';
  if (left === 2) return 'Semi';
  if (left === 3) return 'Quarter';
  return 'Round ' + (r + 1);
};

function useVh() {
  const [vh, setVh] = useState(800);
  useEffect(() => {
    const f = () => setVh(window.innerHeight || 800);
    f(); window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return vh;
}

export default function BracketStage({
  bg, items, metric, rounds, picks, truth, idOf, kidsOf, onPick, onLock, onDone,
  onHelp, giveUp, elapsed,
}) {
  const [look, setLook] = useStageLook();
  const pal = stagePalette(bg, look);
  useStageChrome(pal.bg);
  const vh = useVh();

  const N = items.length;
  const MATCHES = N - 1;
  const roundW = (r) => N / Math.pow(2, r + 1);
  const ids = useMemo(() => {
    const out = [];
    for (let r = 0; r < rounds; r++) for (let m = 0; m < roundW(r); m++) out.push([r, m]);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N, rounds]);
  const ready = (r, m) => { const k = kidsOf(r, m); return k[0] >= 0 && k[1] >= 0; };
  const firstOpen = () => {
    for (let i = 0; i < ids.length; i++) if (picks[idOf(ids[i][0], ids[i][1])] < 0 && ready(ids[i][0], ids[i][1])) return i;
    return 0;
  };

  const [cur, setCur] = useState(firstOpen);
  const [phase, setPhase] = useState('play');     // play | merge | champ | reveal
  const [mergeRound, setMergeRound] = useState(0);
  const [tight, setTight] = useState(false);
  const [fill, setFill] = useState(false);
  const [shown, setShown] = useState(0);
  const timers = useRef([]);
  const later = (ms, fn) => { timers.current.push(setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  const [r, m] = ids[Math.min(cur, ids.length - 1)];
  const n = roundW(r);
  const filled = picks.filter((p) => p >= 0).length;

  // sizes: a matchup is two answer bars, a label and the OR; the window shows
  // one whole matchup plus a strip of the next above and the last below
  const ch = Math.max(62, Math.min(100, Math.floor((vh - 560) / 2.4)));
  const GAP = 18;
  const H = ch * 2 + 62;
  const PEEK = vh < 720 ? 56 : 80;
  const WIN = H + PEEK * 2;

  function choose(item) {
    if (phase !== 'play') return;
    const id = idOf(r, m);
    onPick(r, m, item);
    const next = picks.slice(); next[id] = item;
    const roundDone = Array.from({ length: n }, (_, k) => next[idOf(r, k)] >= 0).every(Boolean);
    if (!roundDone) {
      // next open matchup in this round, else the next one along
      let j = -1;
      for (let k = m + 1; k < n; k++) if (next[idOf(r, k)] < 0) { j = k; break; }
      if (j < 0) for (let k = 0; k < n; k++) if (next[idOf(r, k)] < 0) { j = k; break; }
      later(260, () => setCur(ids.findIndex(([a, b]) => a === r && b === j)));
      return;
    }
    if (r < rounds - 1) {
      later(320, () => { setMergeRound(r); setTight(false); setPhase('merge'); });
      later(900, () => setTight(true));
      later(2300, () => {
        let j = 0;
        for (let k = 0; k < roundW(r + 1); k++) if (next[idOf(r + 1, k)] < 0) { j = k; break; }
        setCur(ids.findIndex(([a, b]) => a === r + 1 && b === j));
        setPhase('play'); setTight(false);
      });
      return;
    }
    // the final: crown the champion, then lock the sheet
    if (next.every((p) => p >= 0)) {
      later(320, () => { setFill(false); setPhase('champ'); });
      later(700, () => setFill(true));
      later(2100, () => {
        onLock();
        setShown(0); setPhase('reveal');
        for (let i = 1; i <= MATCHES; i++) later(i * (MATCHES > 15 ? 95 : 170), () => setShown(i));
        later(MATCHES * (MATCHES > 15 ? 95 : 170) + 1100, () => onDone());
      });
    }
  }
  function cancelLock() {
    clearTimers(); setFill(false); setPhase('play');
    setCur(ids.length - 1);
  }
  const go = (i) => {
    if (i < 0 || i >= ids.length) return;
    const [a, b] = ids[i];
    if (!ready(a, b)) return;
    setCur(i);
  };
  const canBack = cur > 0;
  const canNext = cur < ids.length - 1 && ready(ids[cur + 1][0], ids[cur + 1][1]);

  // the round's matchups, last first, so the next one sits above
  const order = [];
  for (let k = n - 1; k >= 0; k--) order.push(k);
  const shift = PEEK - (n - 1 - m) * (H + GAP);

  // merge: the finished round's winners pair up
  const winners = Array.from({ length: roundW(mergeRound) }, (_, k) => picks[idOf(mergeRound, k)]);
  const pairs = [];
  for (let k = 0; k < winners.length; k += 2) pairs.push([winners[k], winners[k + 1]]);
  const chipH = winners.length > 8 ? 30 : 44;

  // reveal rows and the running score
  const rows = [];
  let score = 0, total = 0;
  for (let rr = 0; rr < rounds; rr++) for (let mm = 0; mm < roundW(rr); mm++) {
    const id = idOf(rr, mm), p = picks[id], ok = p >= 0 && p === truth[id], w = Math.pow(2, rr);
    const i = rows.length;
    total += w;
    if (ok && i < shown) score += w;
    rows.push({ key: id, round: RSHORT(rr, rounds), name: p >= 0 ? items[p].name : '', ok, w, on: i < shown });
  }
  const champ = picks[idOf(rounds - 1, 0)];

  return (
    <div className="bks" role="dialog" aria-label="Bracket" style={{ '--bks-bg': pal.bg, '--bks-ink': pal.ink, '--bks-tile': pal.tile || 'color-mix(in srgb, ' + pal.ink + ' 8%, transparent)', '--bks-ch': `${ch}px`, '--bks-h': `${H}px`, '--bks-gap': `${GAP}px`, '--bks-peek': `${PEEK}px`, '--bks-win': `${WIN}px`, '--bks-chip': `${chipH}px` }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bks-col">
        <StageTopBar look={look} onFlip={() => setLook(nextMainLook(look))} ink={pal.ink} />
        {phase === 'play' && (
          <>
            <div className="bks-eb">{RNAME(r, rounds)}{n > 1 ? ` · Match ${m + 1} of ${n}` : ''} · {Math.pow(2, r)} {Math.pow(2, r) === 1 ? 'pt' : 'pts'}</div>
            <h2 className="bks-q">{metric}</h2>
            <div className="bks-win">
              <div className="bks-strip" style={{ transform: `translateY(${shift}px)` }}>
                {order.map((k) => {
                  const [a, b] = kidsOf(r, k);
                  const pk = picks[idOf(r, k)];
                  const isCur = k === m;
                  const tag = rounds - 1 === r ? 'Champion' : 'Moves on';
                  const bar = (it) => {
                    const on = it >= 0 && pk === it, off = pk >= 0 && pk !== it;
                    return (
                      <button type="button" className={'bks-c' + (on ? ' on' : '') + (off ? ' off' : '')} disabled={!isCur || it < 0}
                        onClick={() => choose(it)} aria-pressed={on}>
                        <span className="bks-nm">{it >= 0 ? items[it].name : 'Waiting on an earlier pick'}</span>
                        {on ? <i>{tag}</i> : null}
                      </button>
                    );
                  };
                  return (
                    <div key={`${r}-${k}`} className={'bks-m' + (isCur ? '' : ' peek')} aria-hidden={isCur ? undefined : 'true'}>
                      <div className="bks-ml">{n > 1 ? `Match ${k + 1} of ${n}` : 'The final'}</div>
                      {bar(a)}
                      <div className="bks-vs">OR</div>
                      {bar(b)}
                    </div>
                  );
                })}
              </div>
              {m < n - 1 && <button type="button" className="bks-jump up" aria-label="Next matchup" onClick={() => go(cur + 1)} />}
              {m > 0 && <button type="button" className="bks-jump dn" aria-label="Previous matchup" onClick={() => go(cur - 1)} />}
            </div>
            <div className="bks-nav">
              <button type="button" className="bks-nb" onClick={() => go(cur - 1)} disabled={!canBack}>Back</button>
              <div className="bks-pips" aria-label={`${filled} of ${MATCHES} picked`}>
                {ids.map(([a, b], i) => <span key={i} className={i === cur ? 'on' : (picks[idOf(a, b)] >= 0 ? 'done' : '')} />)}
              </div>
              <button type="button" className="bks-nb" onClick={() => go(cur + 1)} disabled={!canNext}>Next</button>
            </div>
            <div className="bks-foot">
              <span className="bks-line">Changing a pick clears what it fed. Nothing is scored until the sheet is in.</span>
              <div className="bks-tools">
                <button type="button" className="bks-tl" onClick={onHelp}>How to play</button>
                <span className="bks-clock">{elapsed}</span>
                <button type="button" className={'bks-tl' + (giveUp.armed ? ' on' : '')} onClick={giveUp.onPress}>{giveUp.armed ? 'Tap again to hand it in' : 'Give up'}</button>
              </div>
            </div>
          </>
        )}

        {phase === 'merge' && (
          <div className="bks-merge">
            <div className="bks-eb">Your winners move on</div>
            <div className={'bks-pairs' + (tight ? ' tight' : '')}>
              {pairs.map(([a, b], i) => (
                <div key={i} className="bks-pair">
                  <span className="bks-chip">{a >= 0 ? items[a].name : ''}</span>
                  <span className="bks-vsm">VS</span>
                  <span className="bks-chip">{b >= 0 ? items[b].name : ''}</span>
                </div>
              ))}
            </div>
            <div className={'bks-rname' + (tight ? ' in' : '')}>{RNAME(mergeRound + 1, rounds)}</div>
          </div>
        )}

        {phase === 'champ' && (
          <div className="bks-champ">
            <div className="bks-eb">Your champion</div>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M3 18h18l-1.5-10-4.5 4-3-7-3 7-4.5-4z" /></svg>
            <div className={'bks-cc' + (fill ? ' fill' : '')}>{champ >= 0 ? items[champ].name : ''}</div>
            <div className="bks-line">Locking in your sheet</div>
            <button type="button" className="bks-tl" onClick={cancelLock}>Wait, change a pick</button>
          </div>
        )}

        {phase === 'reveal' && (
          <div className={'bks-rv' + (MATCHES > 15 ? ' tiny' : '')}>
            <div className="bks-eb">All {MATCHES} results land at once</div>
            <div className="bks-rvh"><b>{score}</b><span>of {total} points</span></div>
            {rows.map((row) => (
              <div key={row.key} className={'bks-r' + (row.ok ? ' ok' : ' no') + (row.on ? ' in' : '')}>
                <span className="rd">{row.round}</span>
                <span className="nm">{row.name}</span>
                <span className="mk" aria-label={row.ok ? 'right' : 'wrong'}>{row.ok ? '✓' : '✕'}</span>
                <span className="pts">{row.ok ? `+${row.w}` : '0'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const CSS = `
.bks{position:fixed;inset:0;z-index:85;background:var(--bks-bg);color:var(--bks-ink);display:flex;justify-content:center;overflow-y:auto;overflow-x:hidden;font-family:'Manrope',system-ui,sans-serif;-webkit-tap-highlight-color:transparent;}
.bks *{color:var(--bks-ink);}
.bks-look{position:fixed;top:max(12px, env(safe-area-inset-top));right:12px;z-index:2;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:20px;border:2px solid var(--bks-ink);background:transparent;cursor:pointer;padding:0;opacity:.8}
.bks-col{width:100%;max-width:520px;box-sizing:border-box;padding:max(12px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:14px;min-height:100%;}
.bks-eb{text-align:center;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.75;}
.bks-q{margin:0;text-align:center;font-size:clamp(22px,7vw,28px);line-height:1.15;font-weight:800;letter-spacing:-.02em;}
.bks-win{position:relative;height:var(--bks-win);overflow:hidden;flex:none;}
.bks-strip{position:absolute;left:0;right:0;top:0;display:flex;flex-direction:column;gap:var(--bks-gap);transition:transform .45s cubic-bezier(.2,.8,.2,1);}
.bks-m{height:var(--bks-h);box-sizing:border-box;display:flex;flex-direction:column;gap:8px;transition:opacity .35s;}
.bks-m.peek{opacity:.38;}
.bks-ml{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.75;text-align:center;}
.bks-c{display:flex;align-items:center;justify-content:space-between;gap:10px;height:var(--bks-ch);width:100%;box-sizing:border-box;border-radius:18px;padding:0 18px;background:var(--bks-tile);border:2px solid var(--bks-ink);font-family:inherit;font-size:clamp(19px,6vw,24px);font-weight:800;text-align:left;cursor:pointer;transition:background .2s,opacity .2s;}
.bks-c:disabled{cursor:default;}
.bks-c .bks-nm{flex:1 1 auto;min-width:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.26;}
.bks-c.on{background:var(--bks-ink);}
.bks-c.on, .bks-c.on *{color:var(--bks-bg);}
.bks-c.off{opacity:.45;}
.bks-c i{font-style:normal;flex:none;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;}
.bks-vs{align-self:center;font-size:12px;font-weight:800;opacity:.6;letter-spacing:.1em;}
.bks-jump{position:absolute;left:0;right:0;height:var(--bks-peek);border:0;background:transparent;padding:0;cursor:pointer;}
.bks-jump.up{top:0;}
.bks-jump.dn{bottom:0;}
.bks-nav{display:flex;justify-content:space-between;align-items:center;gap:8px;}
.bks-nb{min-height:44px;padding:0 16px;border-radius:999px;border:2px solid var(--bks-ink);background:transparent;font:inherit;font-size:14px;font-weight:800;cursor:pointer;}
.bks-nb:disabled{opacity:.35;cursor:default;}
.bks-pips{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;max-width:210px;}
.bks-pips span{width:12px;height:6px;border-radius:3px;background:color-mix(in srgb, var(--bks-ink) 22%, transparent);}
.bks-pips span.done{background:color-mix(in srgb, var(--bks-ink) 55%, transparent);}
.bks-pips span.on{background:var(--bks-ink);}
.bks-foot{margin-top:auto;display:flex;flex-direction:column;gap:8px;align-items:center;}
.bks-line{text-align:center;font-size:13px;font-weight:700;opacity:.75;line-height:1.35;}
.bks-tools{display:flex;align-items:center;justify-content:space-between;width:100%;gap:8px;}
.bks-clock{font-size:13px;font-weight:800;opacity:.75;font-variant-numeric:tabular-nums;}
.bks-tl{min-height:40px;padding:0 14px;border-radius:999px;border:2px solid var(--bks-ink);background:transparent;font:inherit;font-size:13px;font-weight:800;cursor:pointer;}
.bks-tl.on{background:var(--bks-ink);}
.bks-tl.on, .bks-tl.on *{color:var(--bks-bg);}
.bks-merge{flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px;}
.bks-pairs{display:flex;flex-direction:column;align-items:center;gap:22px;transition:gap .6s;}
.bks-pairs.tight{gap:12px;}
.bks-pair{display:flex;flex-direction:column;align-items:center;gap:26px;transition:gap .6s cubic-bezier(.2,.8,.2,1);}
.tight .bks-pair{gap:20px;}
.bks-chip{width:min(260px, 80vw);height:var(--bks-chip);border-radius:12px;background:var(--bks-ink);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;padding:0 10px;box-sizing:border-box;text-align:center;}
.bks .bks-chip{color:var(--bks-bg);}
.bks-vsm{font-size:11px;font-weight:800;letter-spacing:.12em;opacity:0;transition:opacity .4s .3s;height:0;line-height:0;overflow:visible;}
.tight .bks-vsm{opacity:.65;}
.bks-rname{text-align:center;font-size:30px;font-weight:800;letter-spacing:-.02em;transform:translateY(-8px);opacity:0;transition:all .5s .45s;}
.bks-rname.in{transform:none;opacity:1;}
.bks-champ{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;}
.bks-cc{width:min(300px, 84vw);min-height:120px;box-sizing:border-box;padding:0 14px;border-radius:22px;border:3px solid var(--bks-ink);display:flex;align-items:center;justify-content:center;text-align:center;font-size:30px;font-weight:800;transition:background .6s,color .6s;}
.bks-cc.fill{background:var(--bks-ink);}
.bks .bks-cc.fill{color:var(--bks-bg);}
.bks-rv{flex:1;display:flex;flex-direction:column;gap:5px;}
.bks-rvh{display:flex;justify-content:space-between;align-items:baseline;margin:2px 0 6px;}
.bks-rvh b{font-size:44px;line-height:1;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;}
.bks-rvh span{font-size:13px;font-weight:800;opacity:.75;}
.bks-r{display:grid;grid-template-columns:72px 1fr 24px 32px;align-items:center;gap:8px;min-height:30px;padding:0 10px;border-radius:9px;font-size:14px;font-weight:800;opacity:0;transform:translateY(-6px);transition:opacity .25s,transform .25s;}
.bks-rv.tiny .bks-r{min-height:22px;font-size:12px;}
.bks-r.in{opacity:1;transform:none;}
.bks-r .rd{font-size:10px;letter-spacing:.06em;text-transform:uppercase;opacity:.7;}
.bks-r .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em;}
.bks-r .pts{text-align:right;font-size:12px;opacity:.8;}
.bks-r.ok{background:color-mix(in srgb, var(--bks-ink) 12%, transparent);}
.bks-r.no .nm{text-decoration:line-through;text-decoration-thickness:2px;opacity:.6;}
.bks-r .mk{width:22px;height:22px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:12px;box-sizing:border-box;}
.bks-r.ok .mk{background:var(--bks-ink);}
.bks .bks-r.ok .mk{color:var(--bks-bg);}
.bks-r.no .mk{border:2px solid var(--bks-ink);}
@media (prefers-reduced-motion: reduce){.bks-strip,.bks-pair,.bks-pairs,.bks-rname,.bks-r,.bks-cc{transition:none;}}
`;
