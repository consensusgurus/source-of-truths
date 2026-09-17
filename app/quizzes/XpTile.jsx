'use client';

import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';
import { T } from '@/lib/theme';

// Top SoT Player tile on /quizzes. Took the Featured Sports slot in row 2 on
// 2026-07-20 (the Newest tile was retired and Geo + Sports each shifted left).
//
// The tile FLIPS between two boards (owner request 2026-07-24): the front face
// ranks by IQ Points earned in the LAST 30 DAYS, the back face by ALL-TIME IQ Points. It uses
// the same 3D card flip the Featured tiles use (rotateY, ~8s hold, paused on
// hover, wide-viewport + motion-ok only), so a visitor sees both the always-in-
// play rolling board and the all-time hall of fame from one tile. /api/quiz/xp
// serves both: ?sort=xp30d for the 30-day board, the default sort for all-time.
//
// The hover panel explains the IQ Points system itself, because the tile is the only
// place on the hub that says out loud what IQ Points are and how to earn them. It sits
// OUTSIDE the flip (shared by both faces), and the TOP SOT PLAYER tag stays on
// the tile frame; only the body (name + podium) turns.

const C = { accent: T.accent, cta: T.cta, gold: '#ffd166' };
// Gold / silver / bronze, matching the medal palette used on the ranking pages.
const MEDAL = [T.gold, '#b8bcc4', '#c8814b', '#5f6f8f', '#5f6f8f'];

// The leader's name is the tile's headline, so it is set as large as will fit
// rather than at a fixed size. Same binary-search fitter as CommunityTile.
const NAME_MIN = 17;
const NAME_MAX = 42;
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function useFittedName(text) {
  const wrapRef = useRef(null);
  const textRef = useRef(null);

  const fit = useCallback(() => {
    const wrap = wrapRef.current;
    const el = textRef.current;
    if (!wrap || !el || !text) return;
    const avail = wrap.clientWidth;
    if (!avail) return;
    let lo = NAME_MIN;
    let hi = NAME_MAX;
    let best = NAME_MIN;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      el.style.fontSize = `${mid}px`;
      // +1 absorbs sub-pixel rounding, which otherwise costs a whole step.
      if (el.scrollWidth <= avail + 1) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    el.style.fontSize = `${best}px`;
  }, [text]);

  useIsoLayoutEffect(() => {
    fit();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [fit]);

  // Webfonts land after first paint and change the metrics, so refit once ready.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts?.ready) return;
    document.fonts.ready.then(fit).catch(() => {});
  }, [fit]);

  return { wrapRef, textRef };
}

const num = (n) => Number(n || 0).toLocaleString();

// One face of the flip: the podium body for a given board (30-day or all-time).
// Each face carries its own fitted-name instance.
function XpBody({ face }) {
  const top = face.top;
  const leader = top && top[0] ? top[0] : null;
  const { wrapRef, textRef } = useFittedName(leader?.name || '');
  return (
    <div className="xp-body">
      <div className="xp-scopelbl">{face.chip}</div>
      {leader ? (
        <>
          <div className="xp-namewrap" ref={wrapRef}>
            <span className="xp-who" ref={textRef}>{leader.name}</span>
          </div>
          <div className="xp-sub">{num(leader.value)} IQ Points earned {face.subWord}</div>
          {/* Runners-up 2-5 as a 2x2 grid, so the tile reads as a podium
              rather than a single name. Rendered 2, 4, 3, 5 so the grid places
              4 to the right of 2 and 5 to the right of 3. To save the space, the
              IQ Points total is shown only for the leader above; the runners-up carry
              the name alone. Empty places render as "Open" on purpose: it shows
              the spot is contested and reachable instead of hiding that it is free. */}
          <div className="xp-podium">
            {[1, 3, 2, 4].map((i) => {
              const r = top && top[i] ? top[i] : null;
              return (
                <div className="xp-prow" key={i}>
                  <span className="xp-medal" style={{ background: MEDAL[i] }}>{i + 1}</span>
                  {r ? (
                    <span className="xp-pname">{r.name}</span>
                  ) : (
                    <span className="xp-pname xp-vacant">Open</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="xp-namewrap" ref={wrapRef}>
            <span className="xp-who" ref={textRef} style={{ fontSize: 24, color: T.white }}>This spot is open</span>
          </div>
          <div className="xp-sub">{face.empty}</div>
        </>
      )}
      <div className="xp-foot">Full leaderboard <ArrowRight size={13} style={{ verticalAlign: -1 }} /></div>
    </div>
  );
}

export default function XpTile() {
  const [top30, setTop30] = useState(null); // [{name,value}] by 30-day IQ Points
  const [topAll, setTopAll] = useState(null); // [{name,value}] by all-time IQ Points
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(0); // flip counter; even face = 30d, odd = all-time
  const [hovered, setHovered] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    let dead = false;
    // 30-day board (the rolling, always-winnable one).
    fetch('/api/quiz/xp?sort=xp30d')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (dead || !d || !Array.isArray(d.players)) return;
        setTop30(d.players.filter((p) => (p.xp30d || 0) > 0).slice(0, 5).map((p) => ({ name: p.name, value: p.xp30d })));
      })
      .catch(() => { /* face falls back to its empty state */ });
    // All-time board (default sort is all-time IQ Points).
    fetch('/api/quiz/xp')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (dead || !d || !Array.isArray(d.players)) return;
        setTopAll(d.players.filter((p) => (p.xp || 0) > 0).slice(0, 5).map((p) => ({ name: p.name, value: p.xp })));
      })
      .catch(() => { /* face falls back to its empty state */ });
    return () => { dead = true; };
  }, []);

  // Flip only on wide viewports and only when motion is welcome (matches the
  // Featured flip tiles). On phones / reduced-motion the tile stays on the
  // 30-day face, static.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const check = () => setAnimate(window.innerWidth > 560 && !mq.matches);
    check();
    window.addEventListener('resize', check);
    if (mq.addEventListener) mq.addEventListener('change', check);
    return () => {
      window.removeEventListener('resize', check);
      if (mq.removeEventListener) mq.removeEventListener('change', check);
    };
  }, []);

  const running = animate && !hovered;
  useEffect(() => {
    if (!running) return undefined;
    const t = setTimeout(() => setN((v) => v + 1), 8000);
    return () => clearTimeout(t);
  }, [n, running]);

  const faces = [
    { key: 'd30', chip: 'Last 30 days', subWord: 'over the last 30 days', empty: 'Nobody has banked IQ Points in the last 30 days yet.', top: top30 },
    { key: 'all', chip: 'All time', subWord: 'all time', empty: 'Nobody has banked IQ Points yet.', top: topAll },
  ];

  return (
    <div
      className={`ttile xptile${open ? ' xp-open' : ''}`}
      onClick={() => setOpen((v) => !v)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setOpen(false); }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        /* Electric-blue ground, so it reads as the IQ Points slot and stays distinct
           from the bronze Community tile it sits in a row with. The gradient is
           on the frame, shared by both flip faces. */
        .xptile{background:radial-gradient(135% 105% at 24% 36%, rgba(91,139,255,.34) 0%, rgba(91,139,255,.08) 46%, rgba(0,0,0,0) 74%), linear-gradient(155deg,#132a5c 0%,var(--accent) 58%,#080f23 100%);cursor:pointer;perspective:1100px;}
        .xptile .xp-tag{position:absolute;top:12px;left:12px;font-size:10px;font-weight:800;letter-spacing:.08em;background:var(--white);border-radius:10px;padding:4px 10px;z-index:5;color:var(--accent);display:inline-flex;align-items:center;gap:4px;}
        /* flip mechanics: only the body turns; the frame + tag + panel stay put */
        .xptile .xpflip{position:relative;width:100%;transform-style:preserve-3d;transition:transform .65s cubic-bezier(.3,.7,.25,1);}
        .xptile .xpface{backface-visibility:hidden;-webkit-backface-visibility:hidden;}
        .xptile .xpface.front{position:relative;z-index:1;}
        .xptile .xpface.back{position:absolute;inset:0;transform:rotateY(180deg);}
        .xptile .xp-dots{position:absolute;top:15px;right:12px;z-index:5;display:flex;gap:4px;pointer-events:none;}
        .xptile .xp-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.4);transition:background .3s;}
        .xptile .xp-dot.on{background:var(--white);}
        .xptile .xp-body{position:relative;z-index:1;padding:18px 16px 15px;}
        .xptile .xp-scopelbl{font-size:9px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#8fb0ff;margin-bottom:5px;}
        .xptile .xp-namewrap{width:100%;}
        /* Auto-fitted: font-size is set inline by useFittedName. */
        .xptile .xp-who{display:block;white-space:nowrap;font-size:${NAME_MAX}px;font-weight:800;letter-spacing:-1.1px;line-height:1.02;color:#a9c6ff;text-shadow:0 2px 18px rgba(0,0,0,.55);}
        .xptile .xp-sub{font-size:12px;font-weight:600;color:rgba(214,228,255,.74);margin-top:5px;}
        .xptile .xp-podium{margin-top:9px;display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;border-top:1px solid rgba(139,178,255,.18);padding-top:7px;}
        .xptile .xp-prow{display:flex;align-items:center;gap:7px;font-size:11.5px;line-height:1.25;min-width:0;}
        .xptile .xp-medal{flex:none;width:14px;height:14px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#12172a;}
        .xptile .xp-pname{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;color:rgba(255,255,255,.82);}
        .xptile .xp-pname.xp-vacant{color:rgba(255,255,255,.34);font-weight:600;font-style:italic;}
        .xptile .xp-pn{flex:none;font-weight:800;color:rgba(214,228,255,.66);font-variant-numeric:tabular-nums;}
        .xptile .xp-foot{display:flex;align-items:center;gap:6px;margin-top:9px;font-size:12px;font-weight:800;color:rgba(255,255,255,.9);}
        .xptile .xp-panel{position:absolute;inset:0;z-index:6;background:rgba(8,15,35,.975);padding:13px 14px;display:flex;flex-direction:column;gap:5px;opacity:0;pointer-events:none;transition:opacity .16s ease;overflow:auto;}
        .xptile:hover .xp-panel,.xptile:focus-within .xp-panel,.xptile.xp-open .xp-panel{opacity:1;pointer-events:auto;}
        .xptile .xp-h{font-size:12px;font-weight:800;letter-spacing:.07em;color:${C.cta};text-transform:uppercase;}
        .xptile .xp-why{font-size:12px;line-height:1.34;font-weight:700;color:${C.gold};}
        .xptile .xp-p{font-size:12px;line-height:1.38;color:rgba(255,255,255,.86);}
        .xptile .xp-cta{display:inline-flex;align-items:center;gap:6px;margin-top:auto;align-self:flex-start;font-size:12.5px;font-weight:800;color:var(--accent);background:${C.cta};border-radius:8px;padding:8px 11px;text-decoration:none;}
      ` }} />

      <span className="xp-tag"><Zap size={11} style={{ verticalAlign: -1, color: '#5b8bff' }} fill="#5b8bff" /> TOP SOT PLAYER</span>
      {animate ? (
        <div className="xp-dots" aria-hidden="true">
          <span className={`xp-dot${n % 2 === 0 ? ' on' : ''}`} />
          <span className={`xp-dot${n % 2 === 1 ? ' on' : ''}`} />
        </div>
      ) : null}

      <div className="xpflip" style={{ transform: `rotateY(${n * 180}deg)` }}>
        <div className="xpface front"><XpBody face={faces[0]} /></div>
        <div className="xpface back"><XpBody face={faces[1]} /></div>
      </div>

      <div className="xp-panel">
        <div className="xp-h">How IQ Points work</div>
        {/* The "why": IQ Points reward volume, not just talent, so the board is
            winnable by anyone willing to keep playing. Keep the copy below it
            SHORT: the panel is capped at the tile's height, and anything longer
            than about three short lines starts scrolling (owner, 2026-07-20). */}
        <div className="xp-why">The more you play, the more you win.</div>
        <div className="xp-p">
          Every correct answer banks IQ Points, and a perfect run pays a 25% bonus.
          Points are never deducted.
        </div>
        <div className="xp-p">The tile flips between the last 30 days and the all-time board.</div>
        {/* The full IQ Points ranking lives in the Stat Hub's Player tab (PlayerPanel
            renders the whole board); there is no standalone leaderboard route. */}
        <Link href="/quizzes/hub?tab=player" className="xp-cta" onClick={(e) => e.stopPropagation()}>
          Full leaderboard <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
