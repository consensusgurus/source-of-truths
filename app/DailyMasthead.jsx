'use client';

// DailyMasthead — shared masthead meta for the daily games.
//
// Renders the game's NAME alongside the issue No., the date, and the
// mindloftdaily.com/<slug> URL (so the URL shows on every screenshot / share).
//
// NAME, NOT LETTER TILES (owner rule, 2026-08-07). Every game used to open
// with its name spelled out in individual black letter tiles, one of them in
// the game's accent. They were dropped sitewide: they cost a whole band of
// vertical space above the board on a phone, and the name in type says the
// same thing in a fraction of it. The `blocks` prop is still ACCEPTED and
// IGNORED rather than removed, so none of the 50+ game clients need an edit;
// delete it from the call sites whenever they are next touched. The name
// comes from lib/daily-games (the roster is the single source of truth for
// display names), keyed by the same `slug` the URL line already uses.
// The No./date/URL group regroups responsively in three tiers, measured live
// with a ResizeObserver against the masthead's own width:
//
//   Tier 1 (wide):   [blocks]  No. # + date        (URL on the row below, beside blocks)
//                              mindloftdaily.com/x
//   Tier 2 (medium): [blocks]  No. #                (No. stays up on the blocks row)
//                    date  mindloftdaily.com/x     (date + URL together, full-width row below)
//   Tier 3 (narrow): [blocks]                       (blocks alone on row 1)
//                    No. # + date                   (all three below as a two-row box)
//                    mindloftdaily.com/x
//
// ink/faded are identical across every game's COLORS, so they are baked in
// here; only the accent (URL color) is passed per game.

import React, { useRef, useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { T } from '@/lib/theme';
import { dailyGameName, DAILY_GAME_MAP } from '@/lib/daily-games';
import useLoft from './useLoft';
import { loftKey } from '@/lib/loft';
import LoftCap from './LoftCap';

// TYPE (owner, 2026-08-04): this meta line is Manrope, NOT Manrope. The navy
// header it sits under carries no mono at all, so the typewriter texture read
// as a different product. tabular-nums does the one useful job mono was doing
// here: the issue number and date keep a fixed digit width as they change day
// to day, so nothing shifts under them. Do not reintroduce mono in this row.
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const INK = T.ink;
const FADED = T.muted;

// A loft game replaces this whole title block with the cap. Everything the cap
// needs is already here: the number, the date, the help handler and the Sunday
// badge, plus the name and category from the daily registry. That is what makes
// the format reachable on all 56 games without editing a single game client.
//
// Figures are deliberately NOT passed. Every client still renders its own live
// stat strip inside its board card, so putting the same numbers in the cap would
// print them twice. They move up per game, as each client's strip comes out.
export default function DailyMasthead({
  blocks,      // accepted and ignored, see the note above
  blockGap = 5, // accepted and ignored

  num,
  dateLabel,
  slug,
  accent,
  sunday = null,
  onHelp,
  marginBottom = 14,
  helpTop = 10,
}) {
  const title = dailyGameName(slug);
  const loft = useLoft(slug);
  const capRef = useRef(null);
  // Two things can only be known from the page the cap lands in, so they are
  // measured rather than guessed:
  //   --loft-col  the width of the column the cap is mounted in, which is the
  //               game's board column, so the cap's content centres over it
  //   margin-top  the page wrapper's own top padding, which otherwise shows as
  //               a strip of page ground between the chrome and the cap
  // The margin is reset before measuring, or the second pass reads the gap it
  // has already closed and reports zero.
  useEffect(() => {
    if (!loft) return undefined;
    const el = capRef.current;
    if (!el) return undefined;
    const apply = () => {
      el.style.marginTop = '0px';
      const parent = el.parentElement;
      if (parent && parent.clientWidth) el.style.setProperty('--loft-col', `${parent.clientWidth}px`);
      const chrome = document.querySelector('.dch-wrap');
      if (chrome) {
        const gap = Math.round(el.getBoundingClientRect().top - chrome.getBoundingClientRect().bottom);
        if (gap > 0) el.style.marginTop = `-${gap}px`;
      }
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [loft]);
  const wrapRef = useRef(null);
  const blocksRef = useRef(null);
  const noRef = useRef(null);
  const dateRef = useRef(null);
  const urlRef = useRef(null);
  const sundayRef = useRef(null);
  const tierRef = useRef(1);
  const [tier, setTier] = useState(1);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === 'undefined') return undefined;
    const GAP = 14, COLGAP = 10;
    // Widening back to a roomier tier needs this much MORE room than the bare
    // fit. Without it the tier can ping-pong: a tier change alters the
    // masthead's height, which can add or remove the page's vertical
    // scrollbar, which changes clientWidth by ~15px, which flips the tier
    // back, forever. The page visibly shook. The margin is wider than any
    // scrollbar, so a scrollbar alone can never drive a flip.
    const HYST = 24;
    const measure = () => {
      const cW = wrap.clientWidth - 28; // reserve the help-button gutter (paddingRight)
      const bW = blocksRef.current ? blocksRef.current.offsetWidth : 0;
      const noW = noRef.current ? noRef.current.offsetWidth : 0;
      const dtW = dateRef.current ? dateRef.current.offsetWidth : 0;
      const urlW = urlRef.current ? urlRef.current.offsetWidth : 0;
      // The Sunday Edition chip sits on the No. row in every tier. It used to
      // be left out of this arithmetic entirely, so on Sunday editions the
      // measured row was ~150px narrower than the one actually rendered: the
      // masthead picked a tier that could not fit, wrapped, and oscillated.
      const suW = sundayRef.current ? sundayRef.current.offsetWidth + COLGAP : 0;
      if (!cW || !bW) return;
      const noSuW = noW + suW;                              // No. # + Sunday chip
      const boxW = Math.max(noSuW + COLGAP + dtW, urlW);    // Tier 1: two-row meta box beside blocks
      const dateUrlW = dtW + COLGAP + urlW;                 // Tier 2: date + URL on one row
      const cur = tierRef.current;
      const room = (target) => (target < cur ? cW - HYST : cW); // only widening pays the margin
      let t;
      if (bW + GAP + boxW <= room(1)) t = 1;
      else if (dateUrlW <= cW && bW + GAP + noSuW <= room(2)) t = 2;
      else t = 3;
      if (t === cur) return;
      tierRef.current = t;
      setTier(t);
    };
    measure();
    // Coalesce to one measurement per frame so a resize that lands mid-layout
    // cannot re-enter (this is also what silences the ResizeObserver
    // "undelivered notifications" loop warning).
    let raf = 0;
    const ro = new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; measure(); });
    });
    ro.observe(wrap);
    return () => { if (raf) cancelAnimationFrame(raf); ro.disconnect(); };
  }, [num, dateLabel, slug, accent, !!sunday]);

  const noEl = (
    <span ref={noRef} style={{ fontFamily: SANS, fontSize: 14, letterSpacing: '-0.005em', fontWeight: 800, color: INK, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>No. {num}</span>
  );
  if (loft) {
    // Look the game up by its KEY: two clients pass their route here.
    const meta = DAILY_GAME_MAP[loftKey(slug)] || null;
    return (
      <div className="lcap-bleed" ref={capRef}>
        <LoftCap
          name={title}
          cat={meta ? meta.cat : ''}
          num={num}
          dateLabel={dateLabel}
          onHelp={onHelp}
          sunday={sunday}
        />
      </div>
    );
  }

  const dateEl = (
    <span ref={dateRef} style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: FADED, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{dateLabel}</span>
  );
  const urlEl = (
    <span ref={urlRef} style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: accent, whiteSpace: 'nowrap' }}>mindloftdaily.com/{slug}</span>
  );
  // Wrapped so its width is measurable; inline-flex keeps the chip on the same
  // baseline it sat on when it was rendered bare.
  const sundayEl = sunday ? (
    <span ref={sundayRef} style={{ display: 'inline-flex', alignItems: 'center' }}>{sunday}</span>
  ) : null;

  return (
    <div ref={wrapRef} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', position: 'relative', paddingRight: 28, marginBottom, borderBottom: '2px solid rgba(28,30,36,0.8)', paddingBottom: 11 }}>
      <div ref={blocksRef} style={{ display: 'flex', alignItems: 'flex-end' }}>
        <h1 style={{ margin: 0, fontFamily: SANS, fontSize: 30, lineHeight: 1, fontWeight: 800, letterSpacing: '-0.03em', color: INK }}>{title}</h1>
      </div>

      {tier === 2 ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>{noEl}{sundayEl}</div>
          <div style={{ flexBasis: '100%', display: 'flex', alignItems: 'baseline', columnGap: 10, rowGap: 3, flexWrap: 'wrap' }}>{dateEl}{urlEl}</div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', rowGap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', columnGap: 10, rowGap: 3, flexWrap: 'wrap' }}>{noEl}{sundayEl}{dateEl}</div>
          {urlEl}
        </div>
      )}

      <button onClick={onHelp} aria-label="How to play" title="How to play" style={{ position: 'absolute', top: helpTop, right: 2, background: 'none', border: 'none', cursor: 'pointer', color: FADED, padding: 0, display: 'flex' }}>
        <HelpCircle size={20} />
      </button>
    </div>
  );
}
