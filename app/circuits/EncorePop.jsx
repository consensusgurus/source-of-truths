"use client";

// EncorePop — the curtain call after the Trivia Gauntlet (2026-10-14).
//
// The Gauntlet plays seven of the trivia quizzes; the rest sit out the day.
// When a player finishes the run, this card invites them back for the
// TRIVIA ENCORE: a second run of the three quizzes that sat out (`games`),
// one life in each, the same rules.
//
// THE CALLER DECIDES WHETHER IT SHOWS. Nothing here reads or writes storage:
// the run page passes `ready` once the scorecard is up, and stamps whatever
// once-a-day key it keeps in `onShown`. The card waits OPEN_MS after `ready`
// (so it never lands on top of the Broadcast ending), then portals to <body>,
// calls onShown() and onOpenChange(true). Closing (Escape, the backdrop, the
// X or Not now) calls onOpenChange(false) and onClose().
//
// REVIEW: `?encore=preview` on the URL forces it open at once, without
// waiting for `ready` and WITHOUT calling onShown, so a review spends nothing.
//
// THE PICTURE is one inline SVG on a fixed viewBox (400 x 230) scaled by
// width, so a 360px phone and a desktop draw the same stage. A gold
// proscenium, a lit ENCORE marquee on its crown, deep red velvet curtains
// with gold fringe and tie-backs, footlights along the apron, a spotlight,
// and three roses thrown onto the boards. On open the footlights come up,
// the marquee drops in and chases its bulbs, the closed curtains PART again
// (that is the encore), the spot hits the stage and the roses land. Motion is CSS
// transform and opacity only, on groups with `transform-box: fill-box`, and
// it plays once. Every animated element's resting pose is its un-animated
// style, so prefers-reduced-motion simply turns the animations off and gets
// the finished picture: curtains open, lights up, roses down.
//
// Colours in the SVG are literals, not stage tokens: it is an illustration
// on the card's own near-black ground, which reads the same in either site
// register (see "SVG PAINT" in CLAUDE.md: no paint here depends on a token).
// The CSS is one string through dangerouslySetInnerHTML and contains no
// apostrophes, so React never escapes a quote inside it.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const OPEN_MS = 1600;
const PREVIEW_GAMES = [{ key: 'sci', name: 'Sci' }, { key: 'art', name: 'Art' }, { key: 'history', name: 'History' }];
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

// ---------------------------------------------------------------- the stage

const GOLD_HI = '#f8e3a0';
const GOLD = '#d6a645';
const GOLD_LO = '#8f6420';
const BULB = '#ffe7a3';

// The valance: a scalloped swag across the top of the opening.
const SWAG_N = 6;
const SWAG_W = (366 - 34) / SWAG_N;
const SWAG_D = (() => {
  let d = 'M34 44 H366 V60';
  for (let i = SWAG_N - 1; i >= 0; i -= 1) {
    const x0 = 34 + (i + 1) * SWAG_W;
    const x1 = 34 + i * SWAG_W;
    d += ` Q${(x0 + x1) / 2} 76 ${x1} 60`;
  }
  return `${d} Z`;
})();
const SWAG_EDGE = (() => {
  let d = 'M34 60';
  for (let i = 0; i < SWAG_N; i += 1) {
    const x0 = 34 + i * SWAG_W;
    const x1 = x0 + SWAG_W;
    d += ` Q${(x0 + x1) / 2} 76 ${x1} 60`;
  }
  return d;
})();

// One side curtain, drawn OPEN and tied back; the right one is this mirrored.
const DRAPE_D = 'M34 44 L114 44 C106 82 84 112 70 128 C82 146 94 166 98 186 L34 186 Z';
// Folds: a few dark creases running down the drape, following its shape.
const CREASES = [
  'M48 46 C48 90 46 120 44 186',
  'M66 46 C64 90 58 116 56 128 C60 150 62 170 62 186',
  'M86 46 C80 84 70 110 64 124',
  'M78 140 C82 158 84 172 84 186',
];

// Bulbs round the marquee, in chase order (clockwise from the top left).
const BULBS = (() => {
  const out = [];
  for (let x = 138; x <= 262; x += 12.4) out.push([x, 8]);
  for (let y = 18; y <= 30; y += 12) out.push([266, y]);
  for (let x = 262; x >= 138; x -= 12.4) out.push([x, 40]);
  for (let y = 30; y >= 18; y -= 12) out.push([134, y]);
  return out;
})();

const FOOTS = [40, 80, 120, 160, 200, 240, 280, 320, 360];

function Rose({ x, y, r, delay, flip = false }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})${flip ? ' scale(1 -1)' : ''}`}>
      <g className="enc-rose" style={{ '--d': `${delay}ms` }}>
        <path d="M2 0 C8 -1 14 1 22 0" fill="none" stroke="#2f5d2a" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M11 0 C13 -5 17 -6 19 -5 C17 -2 14 -1 11 0 Z" fill="#4c8a3c" />
        <path d="M7 0 C8 4 11 5 13 4 C11 2 9 1 7 0 Z" fill="#3f7d34" />
        <path d="M3 -1 L5 -3 L4 0 L5 3 L3 1 Z" fill="#2f5d2a" />
        <circle cx="-2" cy="0" r="5.4" fill="#8e0c1f" />
        <circle cx="-2.6" cy="-0.6" r="4.2" fill="#c41a33" />
        <circle cx="-3" cy="-1" r="2.6" fill="#e0384f" />
        <path d="M-3 -1 C-1.6 -2.4 -0.4 -0.6 -2 0.4 C-3.6 1.4 -5 -0.8 -3.6 -2.6 C-2.2 -4 0.6 -3 0.4 -0.6"
          fill="none" stroke="#7a0a18" strokeWidth="0.8" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Drape({ side }) {
  const mirror = side === 'r' ? 'translate(400 0) scale(-1 1)' : undefined;
  return (
    <g transform={mirror}>
      <g>
        <path d={DRAPE_D} fill="url(#enc-velvet)" />
        <path d={DRAPE_D} fill="url(#enc-fall)" />
        {CREASES.map((d) => <path key={d} d={d} fill="none" stroke="#3a0409" strokeOpacity=".55" strokeWidth="2.2" strokeLinecap="round" />)}
        <path d="M34 186 L98 186" stroke={GOLD} strokeWidth="6" strokeDasharray="1.6 1.9" />
        <path d="M34 183 L98 183" stroke={GOLD_HI} strokeWidth="1.6" />
      </g>
      <g className="enc-tie">
        <path d="M58 124 C64 118 78 120 82 127 C78 133 64 134 58 128 Z" fill="none" stroke={GOLD} strokeWidth="3.2" />
        <path d="M58 124 C64 118 78 120 82 127" fill="none" stroke={GOLD_HI} strokeWidth="1" />
        <path d="M80 128 C83 134 82 140 80 144" fill="none" stroke={GOLD} strokeWidth="1.6" />
        <circle cx="80" cy="145" r="2.8" fill={GOLD_HI} stroke={GOLD_LO} strokeWidth=".6" />
        <path d="M77.5 147 L82.5 147 L84.5 160 L75.5 160 Z" fill={GOLD} stroke={GOLD_LO} strokeWidth=".7" />
        <path d="M76.5 160 V165 M78.7 160 V166 M80.9 160 V166 M83.1 160 V165"
          stroke={GOLD_HI} strokeWidth="1" strokeLinecap="round" />
      </g>
    </g>
  );
}

// The curtain as it hangs CLOSED: a flat panel to the centre line. On open it
// gathers toward its own wing and fades onto the tied-back drape behind it. Its
// resting style is invisible, so reduced motion simply shows the stage open.
function Shut({ side }) {
  const mirror = side === 'r' ? 'translate(400 0) scale(-1 1)' : undefined;
  return (
    <g transform={mirror}>
      <g className="enc-shut">
        <path d="M34 44 H201 V186 H34 Z" fill="url(#enc-velvet)" />
        <path d="M34 44 H201 V186 H34 Z" fill="url(#enc-fall)" />
        <path d="M34 186 L201 186" stroke={GOLD} strokeWidth="6" strokeDasharray="1.6 1.9" />
        <path d="M34 183 L201 183" stroke={GOLD_HI} strokeWidth="1.6" />
        <path d="M199 44 V186" stroke="#3a0409" strokeOpacity=".5" strokeWidth="2" />
      </g>
    </g>
  );
}

export function EncoreStage() {
  return (
    <svg className="enc-svg" viewBox="0 0 400 230" role="img" aria-label="A theater stage: red curtains part under a lit ENCORE marquee, with roses on the boards">
      <defs>
        <linearGradient id="enc-velvet" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="16" y2="0" spreadMethod="repeat">
          <stop offset="0" stopColor="#4f0812" />
          <stop offset=".28" stopColor="#951523" />
          <stop offset=".5" stopColor="#c7303c" />
          <stop offset=".72" stopColor="#8a1220" />
          <stop offset="1" stopColor="#4f0812" />
        </linearGradient>
        <linearGradient id="enc-fall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".55" />
          <stop offset=".35" stopColor="#000" stopOpacity="0" />
          <stop offset=".8" stopColor="#ffb27a" stopOpacity=".08" />
          <stop offset="1" stopColor="#000" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id="enc-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14040a" />
          <stop offset="1" stopColor="#3a0c14" />
        </linearGradient>
        <linearGradient id="enc-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efd38a" />
          <stop offset=".45" stopColor="#c99a3e" />
          <stop offset="1" stopColor="#7a5418" />
        </linearGradient>
        <linearGradient id="enc-goldside" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={GOLD_LO} />
          <stop offset=".5" stopColor={GOLD_HI} />
          <stop offset="1" stopColor={GOLD_LO} />
        </linearGradient>
        <linearGradient id="enc-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b3f1c" />
          <stop offset="1" stopColor="#2b160a" />
        </linearGradient>
        <linearGradient id="enc-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4d6" stopOpacity=".05" />
          <stop offset=".6" stopColor="#fff4d6" stopOpacity=".22" />
          <stop offset="1" stopColor="#fff4d6" stopOpacity=".34" />
        </linearGradient>
        <radialGradient id="enc-pool" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff1c9" stopOpacity=".75" />
          <stop offset="1" stopColor="#fff1c9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="enc-foot" cx=".5" cy="1" r=".9">
          <stop offset="0" stopColor="#ffd27a" stopOpacity=".85" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="enc-halo" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffcf73" stopOpacity=".45" />
          <stop offset="1" stopColor="#ffcf73" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the house: dark, with a warm glow under the marquee */}
      <rect x="0" y="0" width="400" height="230" fill="#0c0508" />
      <ellipse cx="200" cy="24" rx="150" ry="34" fill="url(#enc-halo)" className="enc-halo" />

      {/* upstage: the back drape and the boards */}
      <rect x="34" y="44" width="332" height="142" fill="url(#enc-back)" />
      <rect x="34" y="44" width="332" height="142" fill="url(#enc-velvet)" opacity=".28" />
      <path d="M34 160 H366 V186 H34 Z" fill="url(#enc-floor)" />
      <path d="M34 168 H366 M34 177 H366" stroke="#1d0e06" strokeOpacity=".7" strokeWidth=".8" />

      {/* the spot, coming down through the swag */}
      <g className="enc-spot">
        <path d="M186 56 L214 56 L262 186 L138 186 Z" fill="url(#enc-beam)" />
        <ellipse cx="200" cy="183" rx="64" ry="8" fill="url(#enc-pool)" />
      </g>

      {/* the curtains, tied back, and the closed pair that parts in front of them */}
      <Drape side="l" />
      <Drape side="r" />
      <Shut side="l" />
      <Shut side="r" />

      {/* the valance and its fringe */}
      <path d={SWAG_D} fill="url(#enc-velvet)" />
      <path d={SWAG_D} fill="url(#enc-fall)" />
      <path d={SWAG_EDGE} fill="none" stroke={GOLD} strokeWidth="6" strokeDasharray="1.6 1.9" />
      <path d={SWAG_EDGE} fill="none" stroke={GOLD_HI} strokeWidth="1.4" transform="translate(0 -2.4)" />

      {/* the proscenium: pilasters, the arch, the crown */}
      <path fillRule="evenodd" fill="url(#enc-gold)"
        d="M10 200 V30 Q10 22 18 22 H382 Q390 22 390 30 V200 H366 V62 C366 50 358 44 346 44 H54 C42 44 34 50 34 62 V200 Z" />
      <path d="M34 200 V62 C34 50 42 44 54 44 H346 C358 44 366 50 366 62 V200" fill="none" stroke={GOLD_LO} strokeWidth="2" />
      <rect x="14" y="52" width="16" height="148" fill="url(#enc-goldside)" opacity=".9" />
      <rect x="370" y="52" width="16" height="148" fill="url(#enc-goldside)" opacity=".9" />
      <path d="M19 58 V196 M22 58 V196 M25 58 V196 M375 58 V196 M378 58 V196 M381 58 V196" stroke={GOLD_LO} strokeOpacity=".55" strokeWidth=".8" />
      <path d="M12 52 H32 M368 52 H388" stroke={GOLD_LO} strokeWidth="1.6" />
      <path d="M10 22 H390" stroke={GOLD_HI} strokeWidth="1.2" />
      <path d="M14 30 H128 M272 30 H386" stroke={GOLD_LO} strokeWidth="1.2" strokeOpacity=".8" />
      <path d="M18 36 H128 M272 36 H382" stroke={GOLD_LO} strokeWidth="3" strokeDasharray="2 3" strokeOpacity=".7" />
      <path d="M14 41 H386" stroke={GOLD_LO} strokeWidth="1" strokeOpacity=".6" />

      {/* the apron and its footlights */}
      <path d="M0 200 L4 186 H396 L400 200 V230 H0 Z" fill="url(#enc-floor)" />
      <path d="M4 186 H396" stroke={GOLD_HI} strokeOpacity=".5" strokeWidth="1" />
      <path d="M0 216 H400" stroke="#1d0e06" strokeWidth="1" strokeOpacity=".8" />
      <rect x="0" y="216" width="400" height="14" fill="#160a05" />
      {FOOTS.map((x, i) => (
        <g key={x}>
          <ellipse className="enc-foot" style={{ '--i': i }} cx={x} cy="200" rx="15" ry="11" fill="url(#enc-foot)" />
          <path d={`M${x - 7} 216 Q${x - 7} 207 ${x} 207 Q${x + 7} 207 ${x + 7} 216 Z`} fill="#2a2018" stroke={GOLD_LO} strokeWidth=".8" />
          <ellipse className="enc-bulb" style={{ '--i': i }} cx={x} cy="210" rx="3.4" ry="2" fill={BULB} />
        </g>
      ))}

      {/* the pool of the spot lands on the apron too */}
      <ellipse className="enc-spot" cx="200" cy="194" rx="78" ry="9" fill="url(#enc-pool)" opacity=".7" />

      {/* roses, thrown */}
      <Rose x={170} y={196} r={-16} delay={2050} />
      <Rose x={222} y={201} r={168} delay={2250} flip />
      <Rose x={244} y={192} r={34} delay={2420} />

      {/* the marquee */}
      <g className="enc-sign">
        <path d="M168 0 V4 M232 0 V4" stroke={GOLD_LO} strokeWidth="1.4" />
        <rect x="130" y="3" width="140" height="42" rx="7" fill="#1b0a0d" stroke="url(#enc-gold)" strokeWidth="3" />
        <rect x="140" y="13" width="120" height="22" rx="3" fill="#2a0e13" />
        {BULBS.map(([x, y], i) => (
          <circle key={`${x}-${y}`} className="enc-chase" style={{ '--i': i }} cx={x} cy={y} r="2.1" fill={BULB} />
        ))}
        <text x="200" y="31.5" textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif" fontWeight="800"
          fontSize="19" letterSpacing="4.5" fill="none" stroke="#ff9f43" strokeOpacity=".45" strokeWidth="3.2">ENCORE</text>
        <text x="200" y="31.5" textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif" fontWeight="800"
          fontSize="19" letterSpacing="4.5" fill="#fff1c1">ENCORE</text>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------- the card

export default function EncorePop({ ready = false, games = [], href = '/triviaencore', onOpenChange, onShown, onClose }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const fired = useRef(false);
  const goRef = useRef(null);
  const backRef = useRef(null);
  const cbs = useRef({ onOpenChange, onShown, onClose });
  cbs.current = { onOpenChange, onShown, onClose };

  const close = useCallback(() => {
    setOpen(false);
    try { cbs.current.onOpenChange && cbs.current.onOpenChange(false); } catch (e) {}
    try { cbs.current.onClose && cbs.current.onClose(); } catch (e) {}
  }, []);

  // ?encore=preview: open at once for review, spending nothing.
  useEffect(() => {
    let q = null;
    try { q = new URLSearchParams(window.location.search).get('encore'); } catch (e) {}
    if (q !== 'preview' || fired.current) return;
    fired.current = true;
    setPreview(true);
    setOpen(true);
    try { cbs.current.onOpenChange && cbs.current.onOpenChange(true); } catch (e) {}
  }, []);

  useEffect(() => {
    if (!ready || fired.current) return undefined;
    const t = setTimeout(() => {
      if (fired.current) return;
      fired.current = true;
      setOpen(true);
      try { cbs.current.onShown && cbs.current.onShown(); } catch (e) {}
      try { cbs.current.onOpenChange && cbs.current.onOpenChange(true); } catch (e) {}
    }, OPEN_MS);
    return () => clearTimeout(t);
  }, [ready]);

  // Escape closes; focus goes to the primary button and comes back after.
  useEffect(() => {
    if (!open) return undefined;
    try { backRef.current = document.activeElement; } catch (e) {}
    const f = setTimeout(() => { try { goRef.current && goRef.current.focus({ preventScroll: true }); } catch (e) {} }, 30);
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    try { document.documentElement.dataset.sotModal = 'encore'; } catch (e) {}
    return () => {
      clearTimeout(f);
      window.removeEventListener('keydown', onKey);
      try { if (document.documentElement.dataset.sotModal === 'encore') delete document.documentElement.dataset.sotModal; } catch (e) {}
      try { const b = backRef.current; if (b && b.focus && document.contains(b)) b.focus({ preventScroll: true }); } catch (e) {}
    };
  }, [open, close]);

  if (!open || typeof document === 'undefined') return null;
  const list = games && games.length ? games : (preview ? PREVIEW_GAMES : []);
  const word = WORDS[list.length] || String(list.length);

  return createPortal(
    <div className="enp-bd" role="dialog" aria-modal="true" aria-labelledby="enp-h" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: ENCORE_CSS }} />
      <div className="enp" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="enp-x" onClick={close} aria-label="Close"><X size={14} strokeWidth={2.4} /></button>
        <div className="enp-pic"><EncoreStage /></div>
        <div className="enp-body">
          <i className="enp-e">Trivia Encore</i>
          <h2 className="enp-h" id="enp-h">Encore!</h2>
          <p className="enp-p">The crowd wants more. {word} {list.length === 1 ? 'quiz' : 'quizzes'} sat out today&rsquo;s Gauntlet:</p>
          <div className="enp-tags">
            {list.map((g, i) => <span key={g.key || g.name} style={{ animationDelay: `${1900 + i * 110}ms` }}>{g.name}</span>)}
          </div>
          <p className="enp-p enp-p2">Same rules, one life in each.</p>
          <a ref={goRef} className="enp-go" href={href}>Take the encore</a>
          <button type="button" className="enp-no" onClick={close}>Not now</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// No apostrophes anywhere in this string (see the header).
export const ENCORE_CSS = `
.enp-bd{position:fixed;inset:0;z-index:4000;display:flex;align-items:center;justify-content:center;
  padding:16px;background:rgba(3,6,14,.78);backdrop-filter:blur(3px);animation:enpfade .2s ease-out;}
.enp{position:relative;width:100%;max-width:400px;max-height:calc(100vh - 32px);overflow-y:auto;scrollbar-width:none;
  background:#0b0f1a;border:1px solid rgba(233,196,106,.28);border-radius:14px;color:#eef2fa;
  font-family:Manrope,system-ui,-apple-system,sans-serif;box-shadow:0 24px 70px rgba(0,0,0,.65),0 0 0 1px rgba(0,0,0,.4);
  animation:enprise .24s ease-out;}
.enp::-webkit-scrollbar{display:none;}
.enp-x{position:absolute;top:8px;right:8px;z-index:2;background:rgba(11,15,26,.6);border:none;color:#c9b98f;cursor:pointer;
  padding:6px;line-height:0;border-radius:8px;}
.enp-x:hover{color:#fff;background:rgba(11,15,26,.85);}
.enp-x:focus-visible,.enp-no:focus-visible{outline:2px solid #e9c46a;outline-offset:2px;}
.enp-pic{line-height:0;border-bottom:1px solid rgba(233,196,106,.22);}
.enc-svg{display:block;width:100%;height:auto;}
.enp-body{padding:14px 20px 18px;}
.enp-e{display:block;font-style:normal;font-size:9.5px;font-weight:800;letter-spacing:.17em;text-transform:uppercase;color:#c9a54e;margin-bottom:2px;}
.enp-h{font-size:30px;font-weight:800;letter-spacing:-.025em;line-height:1.05;color:#fff;margin:0;animation:enphead .5s 1.7s cubic-bezier(.2,1.5,.4,1) both;}
.enp-p{margin:9px 0 0;font-size:13.5px;line-height:1.5;color:#a9b4cb;font-weight:600;}
.enp-p2{margin-top:10px;color:#eef2fa;}
.enp-tags{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0;}
.enp-tags span{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#f6dd8f;
  padding:5px 10px;border-radius:999px;background:rgba(233,196,106,.12);border:1px solid rgba(233,196,106,.45);
  animation:enptag .45s cubic-bezier(.2,1.4,.4,1) both;}
.enp-go{display:block;margin-top:15px;background:#e9c46a;color:#2a1205;border:none;border-radius:9px;padding:13px 18px;
  font-size:14.5px;font-weight:800;letter-spacing:.02em;text-align:center;text-decoration:none;position:relative;overflow:hidden;}
.enp-go:hover{filter:brightness(1.06);}
.enp-go:focus-visible{outline:2px solid #f8e3a0;outline-offset:3px;}
.enp-go:after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);animation:enpsheen 2.8s 2.4s infinite;}
.enp-no{display:block;width:100%;margin-top:8px;background:transparent;border:1px solid rgba(255,255,255,.14);color:#a9b4cb;
  border-radius:9px;padding:10px 18px;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;}
.enp-no:hover{color:#fff;border-color:rgba(255,255,255,.3);}

.enc-shut,.enc-tie,.enc-spot,.enc-rose,.enc-sign,.enc-foot,.enc-bulb,.enc-chase,.enc-halo{transform-box:fill-box;}
.enc-shut{opacity:0;transform-origin:0 50%;animation:encpart 1.6s .45s cubic-bezier(.62,0,.24,1) both;}
.enc-tie{transform-origin:50% 0;animation:enctie .5s 1.75s ease-out both;}
.enc-spot{animation:encspot .7s 1.35s ease-out both;}
.enc-foot{animation:encfade .5s both;animation-delay:calc(.15s + var(--i) * 45ms);}
.enc-bulb{animation:encfade .3s both;animation-delay:calc(.1s + var(--i) * 45ms);}
.enc-halo{animation:encfade .8s .5s ease-out both;}
.enc-sign{transform-origin:50% 0;animation:encdrop .75s .2s cubic-bezier(.3,1.5,.5,1) both;}
.enc-chase{animation:encchase .7s 3 ease-in-out both;animation-delay:calc(.9s + var(--i) * 40ms);}
.enc-rose{transform-origin:50% 50%;animation:enctoss .75s cubic-bezier(.3,.6,.4,1) both;animation-delay:var(--d);}

@keyframes enpfade{from{opacity:0}to{opacity:1}}
@keyframes enprise{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
@keyframes enphead{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}
@keyframes enptag{from{opacity:0;transform:translateY(-6px) scale(.85)}to{opacity:1;transform:none}}
@keyframes enpsheen{0%{left:-60%}40%,100%{left:130%}}
@keyframes encpart{0%{opacity:1;transform:scaleX(1)}70%{opacity:1;transform:scaleX(.44)}100%{opacity:0;transform:scaleX(.38)}}
@keyframes enctie{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@keyframes encspot{from{opacity:0}to{opacity:1}}
@keyframes encfade{from{opacity:0}to{opacity:1}}
@keyframes encdrop{from{opacity:0;transform:translateY(-40px)}to{opacity:1;transform:none}}
@keyframes encchase{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes enctoss{0%{opacity:0;transform:translate(-30px,-150px) rotate(-320deg) scale(1.4)}
  70%{opacity:1;transform:translate(2px,2px) rotate(8deg) scale(1)}100%{opacity:1;transform:none}}

@media(max-width:420px){.enp-body{padding:12px 16px 16px;}.enp-h{font-size:27px;}}
@media(prefers-reduced-motion:reduce){
  .enp-bd,.enp,.enp-h,.enp-tags span,.enp-go:after,
  .enc-shut,.enc-tie,.enc-spot,.enc-rose,.enc-sign,.enc-foot,.enc-bulb,.enc-chase,.enc-halo{animation:none;}
}
`;
