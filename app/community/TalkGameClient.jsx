'use client';
// ONE DISCUSSION, /community/talk/<game> (owner, 2026-11-18). Today by default;
// ?date=M-D-YY opens a past day's discussion (read only, and still only for a
// player with a result on that day's puzzle).
import React, { useState } from 'react';
import Link from 'next/link';
import CommunityShell from './CommunityShell';
import TalkPanel from './TalkPanel';
import GlyphTile from './GlyphTile';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { todaySuffix, suggestHref } from './communityClient';

function labelOf(day) {
  const m = /^(\d+)-(\d+)-(\d+)$/.exec(day || '');
  if (!m) return '';
  const d = new Date(Date.UTC(2000 + Number(m[3]), Number(m[1]) - 1, Number(m[2]), 12));
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
function shift(day, n) {
  const m = /^(\d+)-(\d+)-(\d+)$/.exec(day || '');
  if (!m) return day;
  const d = new Date(Date.UTC(2000 + Number(m[3]), Number(m[1]) - 1, Number(m[2]) + n, 12));
  return `${d.getUTCMonth() + 1}-${d.getUTCDate()}-${d.getUTCFullYear() % 100}`;
}

export default function TalkGameClient({ gameKey, day: day0 = null }) {
  const g = DAILY_GAME_MAP[gameKey];
  const today = todaySuffix();
  const [day] = useState(day0 || today);
  const [n, setN] = useState(null);
  if (!g) return <CommunityShell tab="talk" title="Post-Game Talk"><p className="cm-mut">That puzzle is not on Mind Loft.</p></CommunityShell>;
  const isToday = day === today;
  const prev = shift(day, -1);
  const next = shift(day, 1);
  return (
    <CommunityShell tab="talk"
      title={`${isToday ? 'Today’s' : ''} ${g.name}${isToday ? '' : `: ${labelOf(day)}`}`.trim()}
      sub={`${n ? `${n} ${n === 1 ? 'player is' : 'players are'} talking. ` : ''}${isToday ? 'Closes at midnight Eastern, then moves to the archive.' : 'This discussion is closed. It stays here to read.'}`}
      aside={(
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="cm-btn" href={`/community/talk/${gameKey}?date=${prev}`}>Previous Day</Link>
          {!isToday ? <Link className="cm-btn" href={next === today ? `/community/talk/${gameKey}` : `/community/talk/${gameKey}?date=${next}`}>Next Day</Link> : null}
          <Link className="cm-btn pri" href={suggestHref(gameKey)}>Suggest A {g.name} Idea</Link>
        </div>
      )}>
      <div className="cm-g21">
        <section className="cm-card">
          <div className="cm-ch">
            <b style={{ display: 'flex', alignItems: 'center', gap: 10 }}><GlyphTile gameKey={gameKey} size={32} glyph={18} />{g.name} Discussion</b>
            <Link href={isToday ? g.href : `${g.href}`}>Play {g.name}</Link>
          </div>
          <div className="cm-cb"><TalkPanel gameKey={gameKey} gameName={g.name} day={day} playHref={g.href} onCount={setN} /></div>
        </section>
        <div className="cm-col">
          <section className="cm-card">
            <div className="cm-ch"><b>House Rules</b></div>
            <div className="cm-cb">
              <p className="cm-mut">Talk about the puzzle, how you cracked it and what tripped you up. Be kind, keep it about the game, and no links.</p>
              <p className="cm-mut">Three reports hide a post until we take a look.</p>
            </div>
          </section>
          <section className="cm-card">
            <div className="cm-ch"><b>About {g.name}</b></div>
            <div className="cm-cb"><p className="cm-mut">{g.tagLong || g.tag || ''}</p><div><Link className="cm-btn" href="/community/talk">All Discussions</Link></div></div>
          </section>
        </div>
      </div>
    </CommunityShell>
  );
}
