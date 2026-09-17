'use client';

// DailyTopNav — the quiet top strip on every daily game page: links out to the
// rest of the site (Quizzes, Top 10 Lists) on the left, and the player's
// name + rank chip on the right. Shown full-size before the game starts and in
// a COMPACT form during play (pass compact={playing}), so it stays available
// the whole time without crowding the board — the "lighter page" nav that used
// to disappear on `playing`.
//
// SIZING (owner rule, 2026-08-01): the strip must ALWAYS fit on ONE line, phones
// included. The row is flex-nowrap, the two links never shrink, and the player
// name ellipsis-truncates to absorb any overflow. Type steps down at <=560px and
// again at <=370px so all three elements clear a 360px viewport. Do NOT
// reintroduce flexWrap here — a wrapped strip shoves the masthead down the page.
//
// One component so all daily clients share the exact same strip and compact
// behavior. Used by every daily game client.

import React from 'react';
import { T } from '@/lib/theme';

const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const COLORS = { ink: T.ink, faded: T.muted, ember: T.accent, paper: T.paper };

export default function DailyTopNav({ player, compact = false }) {
  const fz = compact ? 9.5 : 10.5;
  const navStyle = {
    fontFamily: MONO, fontSize: fz, letterSpacing: '0.12em', textTransform: 'uppercase',
    color: COLORS.faded, textDecoration: 'none', borderBottom: '1px solid rgba(28,30,36,0.25)', paddingBottom: 1,
    whiteSpace: 'nowrap', flexShrink: 0,
  };
  return (
    <div className="dtn-row"
      style={{ display: 'flex', alignItems: 'center', gap: compact ? 11 : 15, marginBottom: compact ? 11 : 20, flexWrap: 'nowrap', minWidth: 0 }}>
      <style dangerouslySetInnerHTML={{ __html: '\
        @media(max-width:560px){\
          .dtn-row{gap:9px !important;}\
          .dtn-row .dtn-lnk{font-size:9px !important;letter-spacing:0.09em !important;}\
          .dtn-row .dtn-chip{font-size:9px !important;gap:5px !important;padding:3px 7px !important;}\
          .dtn-row .dtn-nm{max-width:96px !important;}\
        }\
        @media(max-width:370px){\
          .dtn-row{gap:7px !important;}\
          .dtn-row .dtn-lnk{font-size:8.5px !important;letter-spacing:0.05em !important;}\
          .dtn-row .dtn-chip{font-size:8.5px !important;gap:4px !important;padding:3px 6px !important;}\
          .dtn-row .dtn-nm{max-width:66px !important;}\
        }\
      ' }} />
      <a href="/" className="dtn-lnk" style={navStyle}>Puzzles &amp; Quizzes</a>
      <a href="/lists" className="dtn-lnk" style={navStyle}>Top 10 Lists</a>
      {player && (
        <a href={player.key ? `/quizzes/hub?player=${encodeURIComponent(player.key)}` : '/quizzes/hub'} title="Your Stat Hub"
          className="dtn-chip"
          style={{ marginLeft: 'auto', minWidth: 0, display: 'inline-flex', alignItems: 'center', gap: compact ? 5 : 6, fontFamily: MONO, fontSize: fz, letterSpacing: '0.06em', color: COLORS.ink, background: COLORS.paper, border: '1.5px solid rgba(28,30,36,0.35)', borderRadius: 5, padding: compact ? '3px 7px' : '4px 9px', textDecoration: 'none' }}>
          <span className="dtn-nm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: compact ? 120 : 150, fontWeight: 500 }}>{player.name}</span>
          {player.rank ? <span style={{ color: COLORS.ember, fontWeight: 500, whiteSpace: 'nowrap' }}>Rank #{player.rank}</span> : null}
        </a>
      )}
    </div>
  );
}
