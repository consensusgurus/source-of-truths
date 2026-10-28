'use client';

// THE ROLLING PHONE ENDING (owner, 2026-10-28). Mock-up: the "Rolling Mobile
// Ending" canvas. It replaced the one-page phone ending's long scroll.
//
// THREE BEATS, one at a time, each rolling UP into the result bar when it is
// done:
//   0. The message   the verdict and the game's key figure, big, mid-screen
//   1. The stats     today's field, you against yourself, today's board
//   2. The rest      Play next (with the archive calendar) and the Challenge
//
// After the stats roll up, the page is essentially just Play next and the
// Challenge. The result and the standings live in ONE full-width bar at the
// top (owner, 2026-10-28): verdict + key figure + standing, the standing being
// the group when at least one other group member played, else the overall
// board. The bar's text fills its width (it sizes itself, never wraps or runs
// off), and its dropdown opens everything that rolled up, plus Show Board.
//
// Header: the Mind Loft home (house + name), Replay where a replay exists, and
// the same Share-for-credit as the puzzle page. No text links anywhere.
//
// THE REPLAY POP-UP GAMES (End Game, the attempt-ranked games, Arcade: the
// ones LossHold covers). On a phone an unsolved finish no longer stops on that
// pop-up: it plays this ending, and the final view LEADS with Replay
// instantly, because on those games the replay is the point.
//
// Desktop is untouched: app/StageStick.jsx keeps its in-page ending there.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { shareForCredit } from '@/lib/share-credit';
import { pageAge, BEAT_FRESH } from '@/lib/finish-beat';
import GameGlyph from './GameGlyph';

const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// How long each beat holds before it rolls up (ms). The stats beat never
// starts before the figures it shows are in (StageStick's `go`).
const MSG_MS = 2300;
const STATS_MS = 3900;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function isoOf(label) {
  if (!label) return null;
  const d = new Date(label);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// THE STANDING ON THE BAR: the group when at least one OTHER member played
// this game, else the overall board.
function groupStanding(grp, gameKey) {
  if (!grp || !Array.isArray(grp.groups) || !gameKey) return null;
  for (const g of grp.groups) {
    if (!g || g.failed) continue;
    const all = (g.boards && g.boards[gameKey]) || [];
    const mine = all.find((r) => r.userKey === grp.userKey);
    if (mine && all.length > 1) return { rank: mine.rank, n: all.length, name: g.name };
  }
  return null;
}

export default function StageRoll({
  eyebrow, verdict, metric, self, rankHead, go = true, gameKey, gameName, grp,
  statsNode, rankNode, recordNode, chalNode, runNode, shelfNode, catsNode, allHref,
  similar, another, archive, curISO, onShowBoard, showBoardLabel, onReplay, replayHref, retry, homeHref,
}) {
  const [fresh] = useState(() => {
    try {
      if (/[?&]flood=1(&|$)/.test(window.location.search)) return true;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    } catch (e) { /* fall through */ }
    return pageAge() >= BEAT_FRESH;
  });
  // A reopened finish (a refresh, an archive visit) lands on the final view.
  const [phase, setPhase] = useState(fresh ? 0 : 2);
  const [open, setOpen] = useState(false);
  const [cal, setCal] = useState(false);
  const [toast, setToast] = useState('');
  const mountAt = useRef(Date.now());
  // Each beat holds, then rolls up. The message holds from the mount; the
  // stats wait for the figures (go) and then hold their own beat.
  useEffect(() => {
    if (!go || phase >= 2) return undefined;
    const delay = phase === 0 ? Math.max(0, MSG_MS - (Date.now() - mountAt.current)) : STATS_MS;
    const t = setTimeout(() => setPhase((p) => (p === phase ? p + 1 : p)), delay);
    return () => clearTimeout(t);
  }, [go, phase]);
  const advance = () => {
    if (phase >= 2) { setOpen(false); return; }
    setPhase(phase + 1);
  };
  const tapBar = () => {
    if (phase >= 2) { setOpen((v) => !v); return; }
    setPhase(2); setOpen(false);
  };

  // ── THE BAR'S TEXT, fitted to its width ────────────────────────────────
  const head = [verdict, metric && metric.text].filter(Boolean).join(' ');
  const gs = groupStanding(grp, gameKey);
  const variants = phase < 2 ? [head]
    : gs ? [`${head} · #${gs.rank} of ${gs.n} in ${gs.name}`, `${head} · #${gs.rank} of ${gs.n}`]
    : rankHead ? [`${head} · ${rankHead}`] : [head];
  const [barText, setBarText] = useState(variants[0]);
  const [barFs, setBarFs] = useState(20);
  const barRef = useRef(null);
  const measRef = useRef(null);
  const vKey = variants.join('|');
  const fit = () => {
    const box = barRef.current;
    const m = measRef.current;
    if (!box || !m || !box.clientWidth) return;
    const room = box.clientWidth;
    // Shorten first (the group name goes before the type gets small), then shrink.
    for (let i = 0; i < variants.length; i += 1) {
      m.textContent = variants[i];
      let s = 24;
      m.style.fontSize = `${s}px`;
      while (s > 13 && m.offsetWidth > room) { s -= 0.5; m.style.fontSize = `${s}px`; }
      if (s >= 16 || i === variants.length - 1) { setBarText(variants[i]); setBarFs(s); return; }
    }
  };
  useIso(() => {
    fit();
    const t1 = setTimeout(fit, 380);
    const t2 = setTimeout(fit, 760);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [vKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const re = () => fit();
    window.addEventListener('resize', re);
    try { document.fonts && document.fonts.ready.then(re); } catch (e) {}
    return () => window.removeEventListener('resize', re);
  }, [vKey]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ── THE ARCHIVE CALENDAR (Play another) ────────────────────────────────
  const days = (Array.isArray(archive) ? archive : [])
    .map((r) => ({ ...r, iso: isoOf(r.dateLabel) }))
    .filter((r) => r.iso && r.href);
  const byIso = new Map(days.map((r) => [r.iso, r]));
  if (curISO && !byIso.has(curISO)) byIso.set(curISO, { iso: curISO, done: true, cur: true });
  const monthKeys = [...new Set([...byIso.keys()].map((k) => k.slice(0, 7)))].sort();
  const firstOpen = days.filter((r) => !r.done).map((r) => r.iso).sort().pop();
  const startMonth = (firstOpen || curISO || monthKeys[monthKeys.length - 1] || '').slice(0, 7);
  const [mi, setMi] = useState(() => Math.max(0, monthKeys.indexOf(startMonth)));
  const mKey = monthKeys[Math.min(mi, monthKeys.length - 1)] || null;
  const calCells = [];
  let monthLabel = '';
  let monthPlayed = 0, monthTotal = 0;
  if (mKey) {
    const [y, m] = mKey.split('-').map(Number);
    monthLabel = MONTHS[m - 1];
    const lead = new Date(y, m - 1, 1).getDay();
    const len = new Date(y, m, 0).getDate();
    for (let b = 0; b < lead; b += 1) calCells.push({ k: 'b' + b, blank: true });
    for (let d = 1; d <= len; d += 1) {
      const iso = `${mKey}-${String(d).padStart(2, '0')}`;
      const r = byIso.get(iso);
      if (r) { monthTotal += 1; if (r.done) monthPlayed += 1; }
      calCells.push({ k: iso, d, r, cur: iso === curISO });
    }
  }
  const hasCal = monthKeys.length > 0 && days.length > 0;

  const doShare = () => shareForCredit((m) => {
    setToast(m);
    setTimeout(() => setToast(''), 4200);
  });

  const beat = (i) => 'srl-beat ' + (phase === i || (phase >= 2 && open && i < 2) ? 'focus' : i < phase ? 'gone' : 'pend');
  const anotherBtn = another || hasCal ? (
    hasCal ? (
      <button type="button" className={'sst-ob srl-ab' + (cal ? ' on' : '')} onClick={() => setCal((v) => !v)} aria-expanded={cal}>
        <span className="g">{gameKey ? <GameGlyph gameKey={gameKey} size={24} /> : null}</span>
        <span className="t"><b>Play another</b><i>{gameName}{' · '}{cal ? 'pick a day' : 'archive'}</i></span>
      </button>
    ) : (
      <a className="sst-ob" href={another.href}>
        <span className="g">{another.key ? <GameGlyph gameKey={another.key} size={24} /> : null}</span>
        <span className="t"><b>Play another</b><i>{another.name}</i></span>
      </a>
    )
  ) : null;

  return (
    <div className={'srl p' + phase}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="srl-top">
        <a className="srl-tb srl-home" href={homeHref || allHref || '/'} aria-label="All Puzzles">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          <svg className="srl-mark" width="18" height="17" viewBox="0 4 120 112" aria-hidden="true"><path d="M60 10L113 43V109H93V63L60 86L27 63V109H7V43Z" fill="var(--sst-bg)" stroke="currentColor" strokeWidth="9" strokeLinejoin="round" /></svg>
          <span className="srl-nm">Mind Loft</span>
        </a>
        <span className="srl-tr">
          {onReplay || replayHref ? (
            replayHref
              ? <a className="srl-tb" href={replayHref} onClick={onReplay || undefined}><ReplayIcon />Replay</a>
              : <button type="button" className="srl-tb" onClick={onReplay}><ReplayIcon />Replay</button>
          ) : null}
          <button type="button" className="srl-tb" onClick={doShare} title="Share this puzzle. New players from your link earn you drawing tickets.">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="M7 8l5-5 5 5" /><path d="M5 13v7h14v-7" /></svg>
            Share
          </button>
        </span>
      </div>
      {toast ? <div className="srl-toast" role="status">{toast}</div> : null}

      <div className="srl-stack">
        <div className="srl-sum">
          <button type="button" className={'srl-bar' + (open ? ' open' : '')} onClick={tapBar}
            aria-expanded={open} aria-label={`${barText}. Show result and standings`}>
            <span className="tx">
              <b ref={barRef} style={{ fontSize: barFs }}>{barText}</b>
              <span ref={measRef} className="srl-meas" aria-hidden="true" />
            </span>
            <span className="ch" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg></span>
          </button>
        </div>

        {onShowBoard ? (
          <section className={'srl-beat ' + (phase >= 2 && open ? 'focus' : phase >= 2 ? 'gone' : 'pend')}>
            <div className="srl-full">
              <button type="button" className="srl-sbd srl-land" onClick={onShowBoard}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v16H4zM4 10h16M4 15h16M10 4v16M15 4v16" /></svg>
                {showBoardLabel || 'Show Board'}
              </button>
            </div>
          </section>
        ) : null}

        <section className={beat(0)}>
          <div className="srl-full">
            <button type="button" className="srl-wrap" onClick={advance} aria-label="Continue">
              <div className="sst-eb srl-land">{eyebrow}</div>
              <div className="sst-v srl-land d1">{verdict}</div>
              {metric ? (
                <div className="sst-m srl-land d2"><b>{metric.text}</b>{metric.label ? <i>{metric.label}</i> : null}</div>
              ) : null}
              {self && self.head ? <div className="srl-chip srl-land d3">{self.head}</div> : null}
            </button>
          </div>
        </section>

        <section className={beat(1)}>
          <div className="srl-full">
            <div className="srl-stats" onClick={(e) => { if (!(e.target.closest && e.target.closest('a,button'))) advance(); }}>
              <div className="sst-card srl-land">{statsNode}</div>
              {rankNode ? <div className="srl-land d2">{rankNode}</div> : null}
              {recordNode && phase >= 2 ? <div className="srl-land d3">{recordNode}</div> : null}
            </div>
          </div>
        </section>

        <section className={'srl-beat ' + (phase >= 2 ? 'focus' : 'pend')}>
          <div className="srl-full">
            <div className="srl-final">
              {retry ? (
                <button type="button" className="sst-run srl-retry srl-land" onClick={retry.onReplay}>
                  <span className="top">
                    <span className="tx">{retry.chip ? <small>{retry.chip}</small> : null}<b>Replay instantly</b></span>
                    <span className="ar" aria-hidden="true">&rarr;</span>
                  </span>
                  {retry.sub ? <span className="ft"><span className="sb srl-wrapsub">{retry.sub}</span></span> : null}
                </button>
              ) : null}

              <section className="sst-card sst-pn srl-land d1">
                <div className="sst-sl">Play next</div>
                <div className="sst-acts">
                  {runNode}
                  {(similar || anotherBtn) ? (
                    <div className={'sst-row' + (similar && anotherBtn ? '' : ' one')}>
                      {similar ? (
                        <a className="sst-ob pri" href={similar.href} onClick={similar.onClick || undefined}>
                          <span className="g">{similar.key ? <GameGlyph gameKey={similar.key} size={24} /> : null}</span>
                          <span className="t"><b>Play similar</b><i>{similar.name}{similar.time ? <small> · {similar.time}</small> : null}</i></span>
                        </a>
                      ) : null}
                      {anotherBtn}
                    </div>
                  ) : null}
                </div>
                {hasCal ? (
                  <div className={'srl-cal' + (cal ? ' open' : '')} aria-hidden={!cal}>
                    <div className="srl-calin">
                      <div className="srl-calh">
                        <button type="button" aria-label="Previous month" disabled={mi <= 0} onClick={() => setMi((v) => Math.max(0, v - 1))} tabIndex={cal ? 0 : -1}>&lsaquo;</button>
                        <b>{gameName} · {monthLabel}</b>
                        <span>{monthPlayed} of {monthTotal} played</span>
                        <button type="button" aria-label="Next month" disabled={mi >= monthKeys.length - 1} onClick={() => setMi((v) => Math.min(monthKeys.length - 1, v + 1))} tabIndex={cal ? 0 : -1}>&rsaquo;</button>
                      </div>
                      <div className="srl-dow" aria-hidden="true"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
                      <div className="srl-grid">
                        {calCells.map((c) => (c.blank ? <span key={c.k} className="srl-day bl" /> : c.r && c.r.href ? (
                          <a key={c.k} href={c.r.href} tabIndex={cal ? 0 : -1}
                            className={'srl-day' + (c.r.done ? ' pl' : '') + (c.cur ? ' td' : '')}
                            aria-label={`${monthLabel} ${c.d}, ${c.r.done ? 'played' : 'not played'}`}>{c.d}</a>
                        ) : (
                          <span key={c.k} className={'srl-day' + (c.r ? ' pl' : ' no') + (c.cur ? ' td' : '')}>{c.d}</span>
                        )))}
                      </div>
                      <div className="srl-leg"><span><i className="pl" />Played</span><span><i />Not played</span></div>
                    </div>
                  </div>
                ) : null}
                {shelfNode}
                {catsNode}
                {allHref ? <a className="sst-all" href={allHref}>See all Daily Puzzles</a> : null}
              </section>

              {chalNode ? <div className="srl-land d2">{chalNode}</div> : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReplayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" />
    </svg>
  );
}

const CSS = `
.srl{width:100%;max-width:560px;margin:0 auto;
  padding:max(8px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(30px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));}
.srl-top{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 0 14px;}
.srl-tr{display:flex;gap:2px;}
/* NO OUTLINES ON THE HEADER (owner, 2026-10-28): plain ink, a 40px tap area. */
.srl-tb{display:inline-flex;align-items:center;gap:5px;height:40px;padding:0 8px;border:0;background:none;border-radius:99px;
  color:var(--sst-ink);font:inherit;font-size:13.5px;font-weight:800;text-decoration:none;cursor:pointer;white-space:nowrap;}
.srl-home{padding:0 8px 0 0;font-size:15.5px;gap:6px;}
.srl-mark{flex:none;display:block;}
@media (max-width:330px){.srl-nm{display:none;}}
.srl-toast{margin:-6px 0 10px;padding:10px 14px;border-radius:12px;background:var(--sst-ink);color:var(--sst-bg);font-size:13px;font-weight:700;line-height:1.35;}
.srl-stack{display:flex;flex-direction:column;gap:10px;transition:padding-top .8s cubic-bezier(.2,.8,.2,1);}
.srl.p0 .srl-stack{padding-top:min(26vh,190px);}

.srl-sum{overflow:hidden;max-height:0;opacity:0;transition:max-height .55s cubic-bezier(.2,.8,.2,1),opacity .3s ease;}
.srl.p1 .srl-sum,.srl.p2 .srl-sum{max-height:60px;opacity:1;transition-delay:.1s;}
.srl.p1 .srl-bar{animation:srl-take1 .6s cubic-bezier(.2,.9,.25,1.2) .38s both;}
.srl.p2 .srl-bar{animation:srl-take2 .6s cubic-bezier(.2,.9,.25,1.2) .38s both;}
@keyframes srl-take1{0%{transform:translateY(10px) scale(.97)}55%{transform:translateY(-3px) scale(1.02)}100%{transform:none}}
@keyframes srl-take2{0%{transform:translateY(10px) scale(.97)}55%{transform:translateY(-3px) scale(1.02)}100%{transform:none}}
.srl-bar{display:flex;align-items:center;gap:4px;width:100%;height:54px;padding:0 10px 0 16px;border:0;border-radius:16px;
  background:var(--sst-card);color:var(--sst-ink);font:inherit;text-align:left;cursor:pointer;}
.srl-bar .tx{flex:1;min-width:0;position:relative;}
.srl-meas{position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font-weight:800;letter-spacing:-.015em;font-variant-numeric:tabular-nums;pointer-events:none;}
.srl-bar b{display:block;width:100%;font-size:20px;font-weight:800;letter-spacing:-.015em;line-height:1.15;white-space:nowrap;overflow:hidden;font-variant-numeric:tabular-nums;}
.srl-bar .ch{flex:none;width:26px;height:26px;display:flex;align-items:center;justify-content:center;opacity:.65;transition:transform .35s cubic-bezier(.2,.8,.2,1);}
.srl-bar.open .ch{transform:rotate(180deg);opacity:1;}
.srl-bar:focus-visible{outline:2px solid var(--sst-ink);outline-offset:2px;}

.srl-full{overflow:hidden;max-height:0;opacity:0;transform:translateY(18px);
  transition:max-height .5s cubic-bezier(.4,0,.2,1),opacity .25s ease,transform .5s cubic-bezier(.2,.8,.2,1);}
.srl-beat.pend,.srl-beat.gone{margin-top:-10px;}
.srl-beat.focus .srl-full{max-height:5000px;opacity:1;transform:none;
  transition:max-height .9s cubic-bezier(.2,.8,.2,1) .28s,opacity .45s ease .32s,transform .7s cubic-bezier(.2,.8,.2,1) .28s;}
/* THE RESULTS ROLL UP INTO THE BAR (owner, 2026-10-28). */
.srl-beat.gone .srl-full{transform:translateY(-64px) scale(.88);transform-origin:50% 0;opacity:0;
  transition:transform .5s cubic-bezier(.4,0,.2,1),opacity .4s ease,max-height .55s cubic-bezier(.4,0,.2,1) .18s;}
.srl-beat.focus .srl-land{animation:srl-land .55s cubic-bezier(.2,.9,.25,1.25) both;}
.srl-beat.focus .srl-land.d1{animation-delay:.45s;}
.srl-beat.focus .srl-land.d2{animation-delay:.62s;}
.srl-beat.focus .srl-land.d3{animation-delay:.8s;}
@keyframes srl-land{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){
  .srl *,.srl-stack{transition:none !important;animation:none !important;}
}
.srl-wrap{display:block;width:100%;padding:0 4px;border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer;}
.srl-chip{display:inline-flex;align-items:center;margin-top:14px;min-height:30px;padding:5px 12px;border-radius:99px;background:var(--sst-card);font-size:13px;font-weight:800;}
.srl-stats{display:flex;flex-direction:column;gap:10px;}
.srl-stats > .sst-card .sst-h2{gap:18px;}
.srl-stats .sst-b{opacity:1;transform:none;pointer-events:auto;}
.srl-sbd{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;height:46px;border:0;border-radius:14px;
  background:var(--sst-wash);color:var(--sst-ink);font:inherit;font-size:14.5px;font-weight:800;cursor:pointer;}
.srl-final{display:flex;flex-direction:column;gap:10px;}
.srl-retry{border:0;font:inherit;text-align:left;cursor:pointer;width:100%;}
.srl-wrapsub{white-space:normal !important;overflow:visible !important;}

.srl-ab{background:none;font:inherit;text-align:left;cursor:pointer;width:100%;}
.srl-ab.on{background:var(--sst-ink);color:var(--sst-bg);}
.srl-cal{overflow:hidden;max-height:0;opacity:0;transition:max-height .55s cubic-bezier(.2,.8,.2,1),opacity .3s ease,margin .55s;}
.srl-cal.open{max-height:460px;opacity:1;margin-top:10px;}
.srl-calin{border-radius:16px;padding:12px;background:var(--sst-wash);}
.srl-calh{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.srl-calh b{font-size:15.5px;font-weight:800;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.srl-calh span{font-size:12px;font-weight:700;opacity:.8;white-space:nowrap;}
.srl-calh button{flex:none;width:32px;height:32px;border:0;border-radius:9px;background:var(--sst-card);color:var(--sst-ink);font:inherit;font-size:18px;font-weight:800;cursor:pointer;}
.srl-calh button[disabled]{opacity:.35;cursor:default;}
.srl-dow,.srl-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;}
.srl-dow span{text-align:center;font-size:10.5px;font-weight:800;letter-spacing:.08em;opacity:.7;padding-bottom:3px;}
.srl-day{height:38px;border-radius:10px;border:2px solid var(--sst-ink);background:var(--sst-card);color:var(--sst-ink);
  display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;font-variant-numeric:tabular-nums;text-decoration:none;}
.srl-day.pl{background:var(--sst-ink);color:var(--sst-bg);}
.srl-day.td{box-shadow:0 0 0 2px var(--sst-bg),0 0 0 4px var(--sst-ink);}
.srl-day.no{border-color:transparent;background:none;opacity:.35;}
.srl-day.bl{visibility:hidden;}
.srl-leg{display:flex;gap:14px;justify-content:center;margin-top:10px;font-size:12px;font-weight:700;}
.srl-leg span{display:inline-flex;align-items:center;gap:6px;}
.srl-leg i{display:inline-block;width:13px;height:13px;border-radius:4px;border:2px solid var(--sst-ink);background:var(--sst-card);}
.srl-leg i.pl{background:var(--sst-ink);}
`;
