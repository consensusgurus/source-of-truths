'use client';
// /groups: the groups you are in, a code box, and "start a group".
// Each group row reads that group's own board for today, so the list says
// where you stand in each one without opening it.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GroupsShell, {
  readIdentity, identityQs, suggestName, ensureAccount, etTodayIso, suffixOfIso, ordinal,
} from './GroupsShell';

export default function GroupsHomeClient() {
  const router = useRouter();
  const [state, setState] = useState(null);     // /api/groups payload
  const [places, setPlaces] = useState({});     // code -> { rank, of, played }
  const [code, setCode] = useState('');
  const [codeErr, setCodeErr] = useState('');
  const [gname, setGname] = useState('');
  const [uname, setUname] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    setUname(readIdentity().username || suggestName());
    let dead = false;
    fetch(`/api/groups?${identityQs()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (!dead) setState(d); })
      .catch(() => { if (!dead) setState({ failed: true, groups: [] }); });
    return () => { dead = true; };
  }, []);

  // Today's place in each group, read off that group's own board.
  useEffect(() => {
    const groups = (state && state.groups) || [];
    if (!groups.length) return;
    const me = readIdentity();
    const suffix = suffixOfIso(etTodayIso());
    let dead = false;
    Promise.all(groups.map(async (g) => {
      try {
        const [b, info] = await Promise.all([
          fetch(`/api/quiz/daily-combined?group=${g.code}&date=${suffix}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/groups/${g.code}?${identityQs()}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
        ]);
        const myKey = info && info.viewer && info.viewer.userKey;
        const rows = ((b && b.overall) || []).filter((r) => (r.total || 0) > 0);
        const mine = rows.find((r) => r.userKey === myKey);
        const leader = rows[0];
        return [g.code, {
          played: rows.length,
          rank: mine ? mine.rank : null,
          total: mine ? mine.total : null,
          leader: leader && leader.userKey !== myKey ? leader.username : null,
          gap: mine && leader && leader.userKey !== myKey ? Math.round((leader.total - mine.total) * 10) / 10 : null,
        }];
      } catch (e) { return [g.code, null]; }
    })).then((pairs) => { if (!dead) setPlaces(Object.fromEntries(pairs)); });
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state && state.groups && state.groups.map((g) => g.code).join(',')]);

  function openCode(e) {
    e.preventDefault();
    const c = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.length !== 5) { setCodeErr('Codes are five letters and numbers.'); return; }
    setCodeErr('');
    router.push(`/groups/${c}`);
  }

  async function create(e) {
    e.preventDefault();
    if (busy) return;
    const name = gname.trim();
    if (!name) { setErr('Give the group a name.'); return; }
    setBusy(true);
    setErr('');
    if (!state || !state.registered) {
      const acct = await ensureAccount(uname);
      if (acct.error) { setErr(acct.error); setBusy(false); return; }
    }
    const me = readIdentity();
    try {
      const r = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, anonId: me.anonId, email: me.email || undefined }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.group) { setErr(d.error || 'Could not start the group. Try again.'); setBusy(false); return; }
      router.push(`/groups/${d.group.code}?new=1`);
    } catch (e2) {
      setErr('Could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  }

  const groups = (state && state.groups) || [];
  const unavailable = state && state.available === false;
  const full = state && state.registered && groups.length >= (state.groupsMax || 5);

  return (
    <GroupsShell eyebrow="Groups">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section className="gh-intro">
        <span className="grp-lbl">Groups</span>
        <h1 className="grp-h1">A daily board for the people you play with.</h1>
        <p className="grp-note" style={{ marginTop: 10, maxWidth: '60ch' }}>
          Start a group and share one link. Everyone who joins gets a private ranking on the daily puzzles,
          game by game, plus stats and a two-week history. Points are the same Mind Loft Daily points the site board uses.
        </p>
      </section>

      {unavailable ? (
        <div className="grp-card gh-card"><p className="grp-note">Groups are being set up. Check back soon.</p></div>
      ) : (
        <div className="gh-grid">
          <section className="grp-card gh-card">
            <span className="grp-lbl">Your groups</span>
            {!state ? <p className="grp-note grp-mute">Loading…</p> : !groups.length ? (
              <p className="grp-note grp-mute" style={{ marginTop: 8 }}>You are not in a group yet. Start one, or open a code someone sent you.</p>
            ) : (
              <ul className="gh-list">
                {groups.map((g) => {
                  const p = places[g.code];
                  let right = <span className="grp-pill wait">…</span>;
                  if (p === null) right = null;
                  else if (p) {
                    if (p.rank === 1) right = <span className="grp-pill gold">1st today</span>;
                    else if (p.rank) right = <span className="grp-pill line">{ordinal(p.rank)} of {p.played}</span>;
                    else right = <span className="grp-pill wait">{p.played ? 'Not played' : 'Nobody yet'}</span>;
                  }
                  return (
                    <li key={g.code}>
                      <Link href={`/groups/${g.code}`} className="gh-row">
                        <span className="gh-name">
                          <b>{g.name}</b>
                          <span className="grp-mute">
                            {g.members} {g.members === 1 ? 'member' : 'members'}
                            {g.role === 'owner' ? ' · you made it' : ''}
                            {p && p.rank && p.gap ? ` · ${p.gap} behind ${p.leader}` : ''}
                          </span>
                        </span>
                        {right}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <form className="gh-code" onSubmit={openCode}>
              <label className="grp-lbl" htmlFor="gh-code">Have a code?</label>
              <div className="grp-row">
                <input id="gh-code" className="grp-in grp-code-in" maxLength={7} placeholder="K7Q2X"
                  value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" autoComplete="off" />
                <button className="grp-btn solid" type="submit">Open</button>
              </div>
              {codeErr ? <p className="grp-err">{codeErr}</p> : null}
            </form>
          </section>

          <section className="grp-card gh-card">
            <span className="grp-lbl">Start a group</span>
            {full ? (
              <p className="grp-note" style={{ marginTop: 8 }}>You are in {groups.length} groups, which is the most one player can be in. Leave one to start another.</p>
            ) : (
              <form className="gh-form" onSubmit={create}>
                <label className="grp-lbl" htmlFor="gh-gname">Group name</label>
                <input id="gh-gname" className="grp-in" maxLength={40} placeholder="e.g. Family Table"
                  value={gname} onChange={(e) => setGname(e.target.value)} />
                {state && !state.registered ? (
                  <>
                    <label className="grp-lbl" htmlFor="gh-uname">Your name on the board</label>
                    <input id="gh-uname" className="grp-in" maxLength={15} value={uname}
                      onChange={(e) => setUname(e.target.value)} autoComplete="nickname" />
                  </>
                ) : null}
                <button className="grp-btn solid" type="submit" disabled={busy || !state}>{busy ? 'Starting…' : 'Create and share'}</button>
                {err ? <p className="grp-err">{err}</p> : null}
                <p className="grp-note grp-mute gh-small">
                  Up to {(state && state.memberMax) || 50} members. You get a link and a five-letter code to send.
                  {state && state.registered ? ` You'll appear as ${state.username}.` : ''}
                </p>
              </form>
            )}
          </section>
        </div>
      )}
    </GroupsShell>
  );
}

const CSS = `
.gh-intro{padding:8px 0 22px;}
.gh-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:16px;align-items:start;}
.gh-card{padding:18px;}
.gh-list{list-style:none;margin:10px 0 0;padding:0;}
.gh-list li{border-top:1px solid var(--stg-line);}
.gh-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;text-decoration:none;color:var(--stg-ink);}
.gh-row:hover b{color:var(--stg-acc-ink);}
.gh-name{display:flex;flex-direction:column;min-width:0;font-size:13px;}
.gh-name b{font-size:15px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.gh-code{margin-top:16px;padding-top:14px;border-top:1px solid var(--stg-line);display:flex;flex-direction:column;gap:8px;}
.gh-code .grp-in{flex:1;}
.gh-form{display:flex;flex-direction:column;gap:8px;margin-top:10px;}
.gh-form .grp-btn{align-self:flex-start;margin-top:6px;}
.gh-small{font-size:12px;}
@media(max-width:800px){.gh-grid{grid-template-columns:1fr;}}
`;
