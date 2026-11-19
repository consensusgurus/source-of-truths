'use client';
// CLUBS, /community/clubs (owner, 2026-11-18). A club is a group (lib/groups.js):
// a private daily board for the people you play with. This tab shows yours with
// today's place in each, and the public clubs anyone can join; starting,
// joining by code and managing a club stay on /groups, where they already work.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CommunityShell from './CommunityShell';
import { identityQs, etTodayIso, suffixOfIso, ordinal } from '../groups/GroupsShell';

export default function ClubsClient() {
  const [mine, setMine] = useState(null);
  const [pub, setPub] = useState(null);
  const [places, setPlaces] = useState({});
  useEffect(() => {
    let dead = false;
    fetch(`/api/groups?${identityQs()}`, { cache: 'no-store' }).then((r) => r.json()).then((d) => { if (!dead) setMine(d); }).catch(() => { if (!dead) setMine({ groups: [] }); });
    fetch(`/api/groups/public?${identityQs()}`, { cache: 'no-store' }).then((r) => r.json()).then((d) => { if (!dead) setPub((d && d.groups) || []); }).catch(() => { if (!dead) setPub([]); });
    return () => { dead = true; };
  }, []);
  useEffect(() => {
    const groups = (mine && mine.groups) || [];
    if (!groups.length) return undefined;
    let dead = false;
    const suffix = suffixOfIso(etTodayIso());
    Promise.all(groups.map(async (g) => {
      try {
        const [b, info] = await Promise.all([
          fetch(`/api/quiz/daily-combined?group=${g.code}&date=${suffix}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/groups/${g.code}?${identityQs()}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
        ]);
        const myKey = info && info.viewer && info.viewer.userKey;
        const rows = ((b && b.overall) || []).filter((r) => (r.total || 0) > 0);
        const me = rows.find((r) => r.userKey === myKey);
        return [g.code, { played: rows.length, rank: me ? me.rank : null, leader: rows[0] ? rows[0].username : null }];
      } catch (e) { return [g.code, null]; }
    })).then((pairs) => { if (!dead) setPlaces(Object.fromEntries(pairs.filter((p) => p[1]))); });
    return () => { dead = true; };
  }, [mine]);
  const groups = (mine && mine.groups) || [];
  const myCodes = new Set(groups.map((g) => g.code));
  const open = (pub || []).filter((g) => !myCodes.has(g.code)).slice(0, 12);
  return (
    <CommunityShell tab="clubs" title="Clubs" sub="Your family, your friends, the office. A club gets its own daily leaderboard, board by board, with two weeks of history. Up to 50 members, and you can be in five."
      aside={<Link className="cm-btn pri" href="/groups">Start Or Join A Club</Link>}>
      {mine && mine.available === false ? <p className="cm-mut" style={{ marginBottom: 16 }}>Clubs are being set up. Check back soon.</p> : null}
      <div className="cm-g2">
        <section className="cm-card">
          <div className="cm-ch"><b>Your Clubs</b><span>{groups.length} of {mine && mine.groupsMax ? mine.groupsMax : 5}</span></div>
          {!mine ? <div className="cm-cb"><p className="cm-mut">Loading&hellip;</p></div> : groups.length ? groups.map((g) => {
            const p = places[g.code];
            return (
              <Link key={g.code} className="cm-rw" href={`/groups/${g.code}`}>
                <span className="cm-glyph" style={{ background: 'var(--cm-lime)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7z" /></svg></span>
                <span className="gr"><b>{g.name}</b><small>{g.members} {g.members === 1 ? 'member' : 'members'}{p ? ` · ${p.played} played today${p.leader ? ` · ${p.leader} leads` : ''}` : ''}</small></span>
                <span className="cm-chip">{p && p.rank ? `You're ${ordinal(p.rank)}` : 'Not played yet'}</span>
              </Link>
            );
          }) : (
            <div className="cm-cb">
              <p className="cm-mut">You are not in a club yet. Start one and share the link, or join one below.</p>
              <div><Link className="cm-btn pri" href="/groups">Start A Club</Link></div>
            </div>
          )}
        </section>
        <section className="cm-card">
          <div className="cm-ch"><b>Open Clubs</b><span>Anyone can join</span></div>
          {!pub ? <div className="cm-cb"><p className="cm-mut">Loading&hellip;</p></div> : open.length ? open.map((g) => (
            <Link key={g.code} className="cm-rw" href={`/groups/${g.code}`}>
              <span className="cm-glyph" style={{ background: 'var(--cm-sky)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14 19a4 4 0 0 1 7 0" /></svg></span>
              <span className="gr"><b>{g.name}</b><small>{g.members || 0} {g.members === 1 ? 'member' : 'members'}{g.owner ? ` · started by ${g.owner}` : ''}</small></span>
              <span className="cm-chip">See Club</span>
            </Link>
          )) : <div className="cm-cb"><p className="cm-mut">No open clubs right now. When you start one, you can make it open to everyone.</p></div>}
        </section>
      </div>
    </CommunityShell>
  );
}
