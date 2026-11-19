'use client';
// THE COMMONS, /community (owner, 2026-11-18): the hub. Today's talk, the top
// ideas, your clubs, the drawing and the community leaderboard, and the doors
// to the rest. Every figure is real; a card with nothing to show says so.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CommunityShell from './CommunityShell';
import GameGlyph from '../GameGlyph';
import { fetchSummary, talkHref } from './communityClient';
import { identityQs } from '../groups/GroupsShell';
import { useDoneToday } from './useDoneToday';

function fmt(n) { return typeof n === 'number' ? n.toLocaleString('en-US') : '–'; }

export default function CommonsClient() {
  const [sum, setSum] = useState(null);
  const [players, setPlayers] = useState(null);
  const [groups, setGroups] = useState(null);
  const done = useDoneToday();
  useEffect(() => {
    let dead = false;
    fetchSummary().then((d) => { if (!dead) setSum(d || { failed: true }); });
    fetch('/api/quiz/pulse').then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!dead && d && Array.isArray(d.players)) setPlayers(d.players[0] || 0);
    }).catch(() => {});
    fetch(`/api/groups?${identityQs()}`, { cache: 'no-store' }).then((r) => r.json()).then((d) => { if (!dead) setGroups(d); }).catch(() => { if (!dead) setGroups({ groups: [] }); });
    return () => { dead = true; };
  }, []);
  const setup = sum && sum.available === false;
  const talk = (sum && sum.talk) || [];
  const ideas = (sum && sum.ideas) || [];

  return (
    <CommunityShell tab="commons" title="The Commons" sub="Everyone who plays the dailies, in one place. Talk about today's puzzles once you finish them, pitch ideas for new ones, and see how your clubs are doing.">
      {setup ? <p className="cm-mut" style={{ marginBottom: 16 }}>The community is being set up. Talk and ideas open shortly.</p> : null}
      <div className="cm-stats" style={{ marginBottom: 20 }}>
        <div className="cm-stat"><b>{fmt(players)}</b><span>Players Today</span></div>
        <div className="cm-stat"><b>{sum && !setup ? fmt(sum.players) : '–'}</b><span>Talking Today</span></div>
        <div className="cm-stat"><b>{sum && !setup ? fmt(talk.length) : '–'}</b><span>Open Discussions</span></div>
        <div className="cm-stat"><b>{sum && !setup ? fmt(sum.ideaCount || 0) : '–'}</b><span>Ideas In Play</span></div>
      </div>
      <div className="cm-g2">
        <div className="cm-col">
          <section className="cm-card">
            <div className="cm-ch"><b>Post-Game Talk</b><Link href="/community/talk">All discussions</Link></div>
            {talk.length ? talk.slice(0, 6).map((t) => (
              <Link key={t.key} className="cm-rw" href={talkHref(t.key)}>
                <span className="cm-glyph" style={{ background: 'var(--cm-sky)' }}><GameGlyph gameKey={t.key} size={20} /></span>
                <span className="gr"><b>{t.name}</b><small>{t.players} {t.players === 1 ? 'player' : 'players'} talking &middot; {t.posts} {t.posts === 1 ? 'post' : 'posts'}</small></span>
                <span className="cm-chip">{done.has(t.key) ? 'Open' : 'Finish To Read'}</span>
              </Link>
            )) : (
              <div className="cm-cb"><p className="cm-mut">{sum ? 'Nobody has posted yet today. Finish a puzzle and start its discussion.' : 'Loading today’s talk…'}</p></div>
            )}
            <div className="cm-foot"><p className="cm-mut" style={{ fontSize: 12.5 }}>Every puzzle has one discussion a day. You can read and post once you finish it, so nothing gets spoiled.</p></div>
          </section>
          <section className="cm-card">
            <div className="cm-ch"><b>Your Clubs</b><Link href="/community/clubs">All clubs</Link></div>
            {groups && Array.isArray(groups.groups) && groups.groups.length ? groups.groups.map((g) => (
              <Link key={g.code} className="cm-rw" href={`/groups/${g.code}`}>
                <span className="cm-glyph" style={{ background: 'var(--cm-lime)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7z" /></svg></span>
                <span className="gr"><b>{g.name}</b><small>{g.members ? `${g.members} ${g.members === 1 ? 'member' : 'members'}` : 'Your club'}</small></span>
                <span className="cm-chip">Open Board</span>
              </Link>
            )) : (
              <div className="cm-cb">
                <p className="cm-mut">{groups ? 'A club is a private daily board for the people you play with: family, friends, the office.' : 'Loading your clubs…'}</p>
                {groups ? <div><Link className="cm-btn pri" href="/groups">Start Or Join A Club</Link></div> : null}
              </div>
            )}
          </section>
        </div>
        <div className="cm-col">
          <section className="cm-card">
            <div className="cm-ch"><b>Idea Board</b><Link href="/community/ideas">See all ideas</Link></div>
            {ideas.length ? ideas.map((i) => (
              <Link key={i.id} className="cm-rw" href={`/community/ideas#idea-${i.id}`}>
                <span className="cm-chip" style={{ minWidth: 52, justifyContent: 'center' }}>{i.votes}</span>
                <span className="gr"><b>{i.title}</b><small>{i.kindLabel}{i.game ? ` · ${i.game.name}` : ''} &middot; {i.stageLabel}</small></span>
              </Link>
            )) : (
              <div className="cm-cb"><p className="cm-mut">{sum ? 'No ideas yet. Pitch a new puzzle, a variation on one you love, or a fix for the site.' : 'Loading ideas…'}</p></div>
            )}
            <div className="cm-foot"><Link className="cm-btn pri" href="/community/ideas?pitch=puzzle">Pitch An Idea</Link></div>
          </section>
          <section className="cm-card">
            <div className="cm-ch"><b>The Drawing And The Leaderboard</b></div>
            <div className="cm-cb">
              <p className="cm-mut">Earn drawing tickets by playing and by bringing friends, and see who has brought the most new players to Mind Loft.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link className="cm-btn" href="/quizzes/community#drawing-earn">Ways To Earn Tickets</Link>
                <Link className="cm-btn" href="/quizzes/community">Community Leaderboard</Link>
              </div>
            </div>
          </section>
          <div className="cm-g2">
            <Link className="cm-card" href="/community/shop" style={{ textDecoration: 'none', color: 'var(--stg-ink)' }}>
              <div className="cm-ch" style={{ background: 'var(--cm-peach)' }}><b>Loft Shop</b><span>Coming Soon</span></div>
              <div className="cm-cb"><p className="cm-mut">Tees, mugs and stickers for people who do puzzles before coffee.</p></div>
            </Link>
            <Link className="cm-card" href="/community/friends" style={{ textDecoration: 'none', color: 'var(--stg-ink)' }}>
              <div className="cm-ch" style={{ background: 'var(--cm-violet)' }}><b>Puzzle Friends</b><span>Coming Soon</span></div>
              <div className="cm-cb"><p className="cm-mut">Other puzzle makers we like. Coming soon: send us a site to list.</p></div>
            </Link>
          </div>
        </div>
      </div>
    </CommunityShell>
  );
}
