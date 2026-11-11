'use client';

// THE CARD, CARRIED ONTO THE START SCREEN (owner, 2026-11-11, mockup N5: "i
// like all of these", then "i thought you implemented N5 to the start pages?").
// Tapping a puzzle's card on the home opens its start screen, which described
// the puzzle in different words and without the card's drawing or chips. This
// puts the card's own three pieces under the name: the board drawing in its
// square tile, the two chips (first fact, then the week's difficulty) and the
// one-line blurb from lib/game-blurbs.js. The game's own short rules and the
// Start button stay exactly as they were, under it.
//
// HOW IT GETS INSIDE THE GATE. Every daily's start card is its own client's
// .stg-gate div (see app/GateScreen.jsx), so nothing is added to 130 clients:
// GateScreen slips one host div in BEFORE the gate's last child (the action
// row, which it styles as :last-child, so the host must never be last, and
// never first either, where the hidden title lives), and this component
// portals into it. CSS order puts it between the name and the rules. The host
// is re-made whenever the gate comes back; it leaves with the gate.
//
// Loaded lazily from GateScreen (next/dynamic, no SSR), so the drawings and
// the blurbs are not in any game's first bundle. The host reserves its height
// in CSS, so nothing below it moves when this arrives.
//
// No crowd strip here (who leads, how many played): that would add a board
// read to every puzzle load. No backtick may appear in the CSS string below.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import GamePreview, { GP_CSS } from './GamePreview';
import { gameBlurb } from '@/lib/game-blurbs';
import { gameFacts, FACT_ICONS } from '@/lib/game-facts';
import { TIERS } from '@/lib/daily-difficulty';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { categoryColor, categoryAccentInkLight } from '@/lib/category-ramp';

// The week's ratings: one shared, CDN-cached read per page load.
let ratingsOnce = null;
function ratings() {
  if (!ratingsOnce) {
    ratingsOnce = fetch('/api/quiz/difficulty').then((r) => r.json()).then((d) => (d && d.ratings) || {}).catch(() => ({}));
  }
  return ratingsOnce;
}

// The slot is made by GateScreen before the first paint (ensureSlot there),
// so its height is held; this only finds it.
function findHost() {
  return document.querySelector('.stage-page .stg-gate > .stg-gx');
}

export default function GateCard({ gameKey }) {
  const [host, setHost] = useState(null);
  const [diff, setDiff] = useState(null);
  useEffect(() => {
    let raf = 0;
    const look = () => { try { const h = findHost(); setHost((cur) => (cur === h ? cur : h)); } catch (e) { /* no gate */ } };
    const kick = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(look); };
    look();
    const mo = new MutationObserver(kick);
    mo.observe(document.querySelector('.stage-page') || document.body, { childList: true, subtree: true });
    let alive = true;
    ratings().then((r) => { if (alive) setDiff(r); });
    return () => { alive = false; mo.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  const g = DAILY_GAME_MAP[gameKey];
  if (!host || !g || !host.isConnected) return null;
  const r = diff && Number(diff[gameKey]);
  const tier = r ? TIERS.find((t) => r >= t.lo && r <= t.hi) : null;
  const facts = gameFacts(gameKey).slice(0, tier ? 1 : 2);
  const blurb = gameBlurb(gameKey);
  return createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: GP_CSS + CSS }} />
      <span className="gx-row" style={{ '--gxc': categoryColor(g.cat), '--gxl': categoryAccentInkLight(g.cat) }}>
        <span className="gx-bd" aria-hidden="true"><GamePreview gameKey={gameKey} square /></span>
        <span className="gx-tx">
          <span className="gx-chips">
            {facts.map((f) => (
              <span key={f.ic} className="gx-c">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={FACT_ICONS[f.ic]} /></svg>{f.tx}
              </span>
            ))}
            {tier ? (
              <span className="gx-c" title={'Difficulty ' + r + ' of 5 this week: ' + tier.sub}>
                <span className="gx-m" aria-hidden="true">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= r ? 'on' : ''} style={{ height: 3 + i * 2 }} />)}</span>{tier.label}
              </span>
            ) : null}
          </span>
          {blurb ? <span className="gx-bl">{blurb}</span> : null}
        </span>
      </span>
    </>,
    host,
  );
}

const CSS = `
.stg-gx .gx-row{display:flex;gap:14px;align-items:flex-start;
  --gpd:var(--gxl);--gpm:var(--gxc);--gpw:var(--stg-surf,#ffffff);--gpt:color-mix(in srgb, var(--gxc) 30%, var(--stg-surf,#ffffff));}
.stage-page:not([data-stage-theme=light]) .stg-gx .gx-row{--gpd:var(--gxc);}
.stg-gx .gx-bd{flex:none;display:block;width:76px;height:76px;box-sizing:border-box;padding:6px;border:1px solid var(--stg-ink,#08222e);border-radius:10px;
  background:color-mix(in srgb, var(--gxc) 26%, var(--stg-surf,#ffffff));}
.stg-gx .gx-tx{min-width:0;display:flex;flex-direction:column;gap:8px;padding-top:3px;}
.stg-gx .gx-chips{display:flex;flex-wrap:wrap;gap:6px;min-height:24px;}
.stg-gx .gx-c{display:inline-flex;align-items:center;gap:5px;height:24px;box-sizing:border-box;padding:0 9px 0 7px;border-radius:999px;
  background:var(--gpt);color:var(--stg-ink,#08222e);font-size:12px;font-weight:700;line-height:1;white-space:nowrap;}
.stg-gx .gx-c svg{color:var(--gpd);flex:none;}
.stg-gx .gx-m{display:inline-flex;gap:2px;align-items:flex-end;}
.stg-gx .gx-m i{display:block;width:4px;border-radius:1px;background:color-mix(in srgb, var(--gpd) 28%, transparent);}
.stg-gx .gx-m i.on{background:var(--gpd);}
.stg-gx .gx-bl{display:block;font-size:15px;line-height:1.4;font-weight:600;color:var(--stg-ink,#08222e);}
`;
