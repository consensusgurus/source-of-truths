'use client';
import React from 'react';
import { Trophy } from 'lucide-react';
import { T } from '@/lib/theme';

// Slim, always-visible top-3 leaderboard strip under the quiz title on EVERY
// format. On phones it collapses to just the #1 spot (entries 2-3 and the play
// count hide via CSS) so it never overflows the right edge; desktop shows the
// full top three plus the play count. Styled to the index system (white card,
// hairline border, medal circles, blue accent). Renders a "be the first" link
// when the quiz has no scores yet so the leaderboard stays reachable.

const C = { ink: T.ink, soft: T.muted, muted: T.muted, acc: T.accent, line: 'rgba(20,22,28,0.30)', gold: T.gold, silver: T.silver, bronze: T.bronze };
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
const MEDAL = [C.gold, C.silver, C.bronze];
const CSS = `.qz-lbstrip{scrollbar-width:none;-ms-overflow-style:none;}
.qz-lbstrip::-webkit-scrollbar{display:none;}
.qz-lbnm{max-width:150px;overflow:hidden;text-overflow:ellipsis;}
@media(max-width:860px){.qz-lbstrip .qz-lbpl{display:none !important;}}
@media(max-width:720px){.qz-lbstrip .qz-lbe-3{display:none !important;}}
@media(max-width:560px){
  .qz-lbstrip .qz-lbe-2,.qz-lbstrip .qz-lbe-3,.qz-lbstrip .qz-lbpl{display:none !important;}
  .qz-lbnm{max-width:108px;}
}`;

export default function LeaderboardStrip({ board, identity, onOpen }) {
  return null; // disabled: leaderboard strip removed from quiz pages (owner 2026-06-30)
  const rows = (identity ? board && board.leaderboard : board && board.leaderboardAll) || [];
  const plays = (board && board.plays) || 0;
  const wrap = (kids) => (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (onOpen) onOpen(); } }}
      title="See the full leaderboard"
      className="qz-lbstrip"
      style={{ display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box', margin: '11px 0 0', padding: '8px 12px', background: `var(--stg-surf,${T.white})`, border: `1px solid ${C.line}`, borderRadius: 12, cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', fontFamily: FONT }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Trophy size={13} strokeWidth={2.5} color={C.acc} style={{ flex: 'none', marginRight: 8 }} />
      <span style={{ flex: 'none', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: `var(--stg-mute,${C.soft})`, marginRight: 12 }}>Leaderboard</span>
      {kids}
    </div>
  );
  if (!rows.length) {
    return wrap(<span style={{ flex: 'none', fontSize: 12.5, color: `var(--stg-mute,${C.muted})` }}>Be the first to post a score <span style={{ color: C.acc, fontWeight: 700 }}>&rarr;</span></span>);
  }
  const top = rows.slice(0, 3);
  const mine = (r) => !!(identity && r.username === identity.username);
  return wrap(
    <>
      <span className="qz-lbscroll" style={{ display: 'flex', alignItems: 'center', flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}>
      {top.map((r, i) => (
        <span key={`${r.username || 'p'}-${i}`} className={`qz-lbe qz-lbe-${i + 1}`} style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 13 }}>
          <span style={{ width: 17, height: 17, borderRadius: '50%', background: MEDAL[i], color: T.white, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{i + 1}</span>
          <span className="qz-lbnm" style={{ fontSize: 12.5, fontWeight: mine(r) ? 800 : 600, color: mine(r) ? C.acc : `var(--stg-ink,${C.ink})` }}>{(r.username || 'Player') + (mine(r) ? ' (you)' : '')}</span>
          <span style={{ fontSize: 12.5, color: `var(--stg-mute,${C.soft})` }}>{r.score}</span>
        </span>
      ))}
      {plays ? <span className="qz-lbpl" style={{ flex: 'none', fontSize: 11.5, color: `var(--stg-mute,${C.soft})` }}>&middot; {plays.toLocaleString()} {plays === 1 ? 'play' : 'plays'}</span> : null}
      </span>
      <span style={{ flex: 'none', marginLeft: 12, paddingLeft: 12, borderLeft: `1px solid ${C.line}`, fontSize: 11, fontWeight: 700, color: C.acc }}>View all &rarr;</span>
    </>
  );
}
