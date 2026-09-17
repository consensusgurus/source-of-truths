'use client';

// FIRST-VISIT WELCOME (owner build, 2026-08-20). A brand-new visitor lands on a
// console of 60-plus games with no obvious door. This overlay is the door: one
// screen that says what the site is and hands them straight into today's Daily
// Five run, which is the site's own answer to "what should I play first".
//
// WHO SEES IT: a browser with NO play footprint, exactly once, on the homepage
// only. The test is positive signals of a RETURNING player, not the absence of
// sot_quiz_anon (lib/visitor.js mints that on the very first paint, so it
// proves nothing):
//   - a registered identity (sot_quiz_identity),
//   - any per-game day breadcrumb (sot_<key>_day, written only once a game is
//     genuinely started or finished, see the t0 rule),
//   - any per-puzzle save (sot_<key>_<num>, written when a game page loads).
// A quiz-only player with none of those may see it once; sot_welcome_seen then
// retires it forever. localStorage unavailable means it never shows, rather
// than showing on every load.
//
// EVERYTHING IS DECIDED IN AN EFFECT and the server renders null, so there is
// no hydration branch and no SEO cost. Same rule as readRunParam: the server
// has no window and no idea what today is in Eastern.
//
// THE CTA STARTS THE RUN DIRECTLY (fiveHref: game one with ?five=1), not the
// /circuits/five landing page: this overlay IS the pitch, and a second
// interstitial between it and a board is friction. When the Five bank has no
// entry for today (fiveFor returns [], the documented degrade), the CTA falls
// back to the Spatial skill circuit, the shortest approachable fixed run, so a
// new visitor is never funneled at nothing. If both are somehow empty the
// primary simply dismisses to the console.
import { useEffect, useState } from 'react';
import { todayFive, fiveHref } from '@/lib/daily-five';
import { circuitKeysFor, circuitHref } from '@/lib/circuits';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import MindLoftMark from './MindLoftMark';

const SEEN_KEY = 'sot_welcome_seen';
const FALLBACK_CIRCUIT = 'spatial';

function isReturningPlayer() {
  try {
    if (localStorage.getItem('sot_quiz_identity')) return true;
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i) || '';
      if (!k.startsWith('sot_')) continue;
      if (/^sot_.+_day$/.test(k)) return true;          // started/finished a daily
      if (/^sot_(?!quiz_|vid_)[a-z]+_\d/.test(k)) return true; // a per-puzzle save
    }
  } catch (e) { return true; } // storage unreadable: never nag
  return false;
}

export default function WelcomeOverlay() {
  const [run, setRun] = useState(null); // { names, href, marquee } or null

  useEffect(() => {
    // ?welcome=1 forces a preview for verification and for showing the owner,
    // without writing the seen key or caring about play footprint.
    let force = false;
    try { force = new URLSearchParams(window.location.search).get('welcome') === '1'; } catch (e) {}
    if (!force) {
      try {
        if (localStorage.getItem(SEEN_KEY)) return;
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return;
        if (isReturningPlayer()) return;
        // Mark seen the moment it shows, so a repeat homepage visit never
        // re-opens it whatever the visitor clicked the first time.
        localStorage.setItem(SEEN_KEY, '1');
      } catch (e) { return; }
    }

    const five = todayFive();
    if (five.length >= 2) {
      setRun({
        names: five.map((k) => (DAILY_GAME_MAP[k] || {}).name).filter(Boolean),
        href: fiveHref(five[0]),
        marquee: true,
      });
      return;
    }
    const alt = circuitKeysFor(FALLBACK_CIRCUIT);
    setRun({
      names: alt.map((k) => (DAILY_GAME_MAP[k] || {}).name).filter(Boolean),
      href: alt.length ? circuitHref(alt[0], FALLBACK_CIRCUIT) : null,
      marquee: false,
    });
  }, []);

  // Lock the page scroll while the overlay is up.
  useEffect(() => {
    if (!run) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [run]);

  if (!run) return null;
  const n = run.names.length;

  return (
    <div className="mlw-scrim" role="dialog" aria-modal="true" aria-label="Welcome to Mind Loft"
      onClick={() => setRun(null)}>
      <style dangerouslySetInnerHTML={{ __html: `
        .mlw-scrim{position:fixed;inset:0;z-index:220;background:rgba(13,24,48,.78);
          display:flex;align-items:center;justify-content:center;padding:18px;}
        .mlw-card{background:#fff;border-radius:16px;max-width:440px;width:100%;
          padding:26px 24px 22px;box-shadow:0 24px 70px rgba(8,15,35,.45);
          font-family:'Manrope',system-ui,-apple-system,sans-serif;color:var(--ink,#0b0d12);
          animation:mlwIn .28s ease-out;}
        @keyframes mlwIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
        .mlw-brand{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
        .mlw-brand b{font-weight:800;font-size:15px;letter-spacing:-.01em;}
        .mlw-eye{font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;
          color:#a98a2e;margin-bottom:6px;}
        .mlw-eye.circ{color:#2563eb;}
        .mlw-hd{font-weight:800;font-size:23px;line-height:1.15;letter-spacing:-.022em;margin:0 0 8px;}
        .mlw-sub{font-weight:600;font-size:13.5px;line-height:1.5;color:var(--muted,#3f4757);margin:0 0 12px;}
        .mlw-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px;}
        .mlw-pills span{background:var(--surface-alt,#eef2f7);border:1.5px solid var(--border,#e5e7eb);
          border-radius:999px;padding:5px 10px;font-weight:800;font-size:11.5px;color:var(--muted,#3f4757);}
        .mlw-cta{display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;
          background:var(--cta,#2563eb);color:#fff;border:0;border-radius:11px;padding:14px;
          font-family:inherit;font-weight:800;font-size:15px;cursor:pointer;}
        .mlw-cta:hover{background:var(--cta-hover,#1d4ed8);}
        .mlw-alt{display:block;width:100%;margin-top:9px;background:transparent;border:0;
          font-family:inherit;font-weight:800;font-size:12.5px;color:var(--slate,#646c7a);
          cursor:pointer;padding:9px;}
        .mlw-alt:hover{color:var(--ink,#0b0d12);}
        .mlw-note{margin-top:10px;text-align:center;font-weight:700;font-size:11px;
          color:var(--slate,#646c7a);}
        @media(max-width:480px){.mlw-card{padding:22px 18px 18px;}.mlw-hd{font-size:20px;}}
      ` }} />
      <div className="mlw-card" onClick={(e) => e.stopPropagation()}>
        <div className="mlw-brand">
          <MindLoftMark size={26} ink="#0b0d12" accent="#2563eb" />
          <b>Mind Loft</b>
        </div>
        <div className={run.marquee ? 'mlw-eye' : 'mlw-eye circ'}>
          {run.marquee ? 'The Daily Five' : 'A starter run'}
        </div>
        <h2 className="mlw-hd">Daily puzzles, one quick run to start.</h2>
        <p className="mlw-sub">
          {run.marquee
            ? `Today's run is ${n} quick games, one from each corner of the site, shortest first. A new five drops at midnight.`
            : `Start with ${n} quick games of routes, shapes and places, shortest first.`}
        </p>
        {run.names.length ? (
          <div className="mlw-pills">{run.names.map((nm) => <span key={nm}>{nm}</span>)}</div>
        ) : null}
        {run.href ? (
          <a className="mlw-cta" href={run.href}>{run.marquee ? 'Start the Daily Five' : 'Start a quick run'}</a>
        ) : (
          <button type="button" className="mlw-cta" onClick={() => setRun(null)}>Show me the puzzles</button>
        )}
        <button type="button" className="mlw-alt" onClick={() => setRun(null)}>
          Browse all the games instead
        </button>
        <div className="mlw-note">Free to play. No account needed.</div>
      </div>
    </div>
  );
}
