'use client';
// POST-GAME TALK, /community/talk (owner, 2026-11-18): every puzzle that ran
// today, the busiest discussions first, then the rest of what you finished, then
// everything else. A discussion opens once you have a result on its puzzle.
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CommunityShell from './CommunityShell';
import GlyphTile from './GlyphTile';
import { fetchSummary, talkHref } from './communityClient';
import { useDoneToday } from './useDoneToday';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { DAY_ROSTER } from '../useDayStats';

export default function TalkIndexClient() {
  const [sum, setSum] = useState(null);
  const done = useDoneToday();
  useEffect(() => { let dead = false; fetchSummary().then((d) => { if (!dead) setSum(d || {}); }); return () => { dead = true; }; }, []);
  const byKey = useMemo(() => new Map(((sum && sum.talk) || []).map((t) => [t.key, t])), [sum]);
  const rows = useMemo(() => {
    const keys = DAY_ROSTER.filter((k) => DAILY_GAME_MAP[k]);
    return keys.map((k) => ({ key: k, g: DAILY_GAME_MAP[k], t: byKey.get(k) || null, mine: done.has(k) }))
      .sort((a, b) => ((b.t ? b.t.players : 0) - (a.t ? a.t.players : 0)) || (Number(b.mine) - Number(a.mine)) || a.g.name.localeCompare(b.g.name));
  }, [byKey, done]);
  const active = rows.filter((r) => r.t);
  const mineQuiet = rows.filter((r) => !r.t && r.mine);
  const rest = rows.filter((r) => !r.t && !r.mine);
  const row = (r) => (
    <Link key={r.key} className="cm-rw" href={r.mine ? talkHref(r.key) : r.g.href}>
      <GlyphTile gameKey={r.key} />
      <span className="gr"><b>{r.g.name}</b><small>{r.t ? `${r.t.players} ${r.t.players === 1 ? 'player' : 'players'} talking · ${r.t.posts} ${r.t.posts === 1 ? 'post' : 'posts'}` : r.g.tag || r.g.cat}</small></span>
      <span className={'cm-chip' + (r.mine ? ' dk' : '')}>{r.mine ? 'See The Discussion' : `Play ${r.g.name}`}</span>
    </Link>
  );
  return (
    <CommunityShell tab="talk" title="Post-Game Talk" sub="One discussion for every puzzle, every day. It opens once you finish that puzzle, so nobody spoils it for you, and every post shows how the poster did. Discussions close at midnight Eastern.">
      {sum && sum.available === false ? <p className="cm-mut" style={{ marginBottom: 16 }}>The community is being set up. Discussions open shortly.</p> : null}
      <div className="cm-g2">
        <div className="cm-col">
          <section className="cm-card">
            <div className="cm-ch"><b>Talking Now</b><span>{active.length} {active.length === 1 ? 'discussion' : 'discussions'}</span></div>
            {active.length ? active.map(row) : <div className="cm-cb"><p className="cm-mut">{sum ? 'Nobody has posted yet today.' : 'Loading…'}</p></div>}
          </section>
          <section className="cm-card">
            <div className="cm-ch"><b>You Finished, Nobody Has Posted Yet</b></div>
            {mineQuiet.length ? mineQuiet.map(row) : <div className="cm-cb"><p className="cm-mut">Finish a puzzle and its discussion opens here.</p></div>}
          </section>
        </div>
        <section className="cm-card">
          <div className="cm-ch"><b>Play To Open</b><span>{rest.length} puzzles</span></div>
          {rest.slice(0, 40).map(row)}
          {rest.length > 40 ? <div className="cm-foot"><Link className="cm-btn" href="/">All Puzzles</Link></div> : null}
        </section>
      </div>
    </CommunityShell>
  );
}
