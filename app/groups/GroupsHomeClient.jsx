'use client';
// /groups: the groups you are in, a code box, and "start a group".
// Each group row reads that group's own board for today, so the list says
// where you stand in each one without opening it.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GroupsShell, {
  readIdentity, identityQs, suggestName, etTodayIso, suffixOfIso, ordinal,
} from './GroupsShell';
import SignupJoin from './SignupJoin';

export default function GroupsHomeClient() {
  const router = useRouter();
  const [state, setState] = useState(null);     // /api/groups payload
  const [places, setPlaces] = useState({});     // code -> { rank, of, played }
  const [code, setCode] = useState('');
  const [codeErr, setCodeErr] = useState('');
  const [gname, setGname] = useState('');
  // Public groups: anyone can see this list, signed in or not.
  const [pub, setPub] = useState(null);
  const [priv, setPriv] = useState([]);
  const [makePublic, setMakePublic] = useState(false);
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
    fetch(`/api/groups/public?${identityQs()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (!dead) { setPub((d && d.groups) || []); setPriv((d && d.private) || []); } })
      .catch(() => { if (!dead) setPub([]); });
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

  // Makes the group for a reader who already has an account. A guest reaches
  // this through SignupJoin, which makes the account first.
  async function createNow() {
    const name = gname.trim();
    if (!name) return { error: 'Give the group a name first.' };
    const me = readIdentity();
    try {
      const r = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, anonId: me.anonId, email: me.email || undefined, visibility: makePublic ? 'public' : 'private' }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.group) return { error: d.error || 'Could not start the group. Try again.' };
      router.push(`/groups/${d.group.code}?new=1`);
      return {};
    } catch (e2) {
      return { error: 'Could not reach the server. Check your connection and try again.' };
    }
  }

  async function create(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr('');
    const res = await createNow();
    if (res.error) { setErr(res.error); setBusy(false); }
  }

  // A guest who signs up without starting a group: reload their (empty) list.
  async function reloadAfterSignup() {
    try {
      const d = await fetch(`/api/groups?${identityQs()}`, { cache: 'no-store' }).then((r) => r.json());
      setState(d);
    } catch (e) { /* the page still works; the list refreshes on the next visit */ }
    return {};
  }

  const groups = (state && state.groups) || [];
  const mineCodes = new Set(groups.map((g) => g.code));
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
            {!state ? <p className="grp-note grp-mute">Loading…</p> : !state.registered ? (
              <div className="gh-signup">
                <p className="grp-note" style={{ margin: '8px 0 12px' }}>
                  Sign up to join groups and keep your place on their boards. Already play under a name? Sign in to see your groups here.
                </p>
                <SignupJoin compact initialName={uname} cta="Sign up" busyCta="Signing up…" onDone={reloadAfterSignup} />
              </div>
            ) : !groups.length ? (
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
                          <b>{g.name} <Vis v={g.visibility} /></b>
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
              state && !state.registered ? (
                // A guest names the group, then signs up and creates it in one press.
                <div className="gh-form">
                  <label className="grp-lbl" htmlFor="gh-gname">Group name</label>
                  <input id="gh-gname" className="grp-in" maxLength={40} placeholder="e.g. Family Table"
                    value={gname} onChange={(e) => setGname(e.target.value)} />
                  <PublicToggle on={makePublic} set={setMakePublic} />
                  <div style={{ marginTop: 8 }}>
                    <SignupJoin compact initialName={uname} cta="Sign up and create" busyCta="Starting…" onDone={createNow}
                      precheck={() => (gname.trim() ? '' : 'Give the group a name first.')} />
                  </div>
                  <p className="grp-note grp-mute gh-small">
                    Up to {state.memberMax || 50} members. You get a link and a five-letter code to send.
                  </p>
                </div>
              ) : (
                <form className="gh-form" onSubmit={create}>
                  <label className="grp-lbl" htmlFor="gh-gname">Group name</label>
                  <input id="gh-gname" className="grp-in" maxLength={40} placeholder="e.g. Family Table"
                    value={gname} onChange={(e) => setGname(e.target.value)} />
                  <PublicToggle on={makePublic} set={setMakePublic} />
                  <button className="grp-btn solid" type="submit" disabled={busy || !state}>{busy ? 'Starting…' : 'Create and share'}</button>
                  {err ? <p className="grp-err">{err}</p> : null}
                  <p className="grp-note grp-mute gh-small">
                    Up to {(state && state.memberMax) || 50} members. You get a link and a five-letter code to send.
                    {state && state.registered ? ` You'll appear as ${state.username}.` : ''}
                  </p>
                </form>
              )
            )}
          </section>
        </div>
      )}

      {/* ALL GROUPS (owner, 2026-09-25). Public ones first, newest first, each
          opened and joined in one tap. Then every private group, marked
          private: a name and a size, never a link, because a private group's
          code is its key and joining takes an invite from a member. Groups
          the reader is already in are not offered again. */}
      {(() => {
        const open = (pub || []).filter((g) => !mineCodes.has(g.code));
        const closed = priv || [];
        if (!open.length && !closed.length) return null;
        return (
          <section className="grp-card gh-card gh-pub">
            <span className="grp-lbl">All groups</span>
            <p className="grp-note grp-mute gh-small" style={{ margin: '6px 0 4px' }}>
              Anyone can join a public group. A private group needs an invite link or code from one of its members.
            </p>
            <ul className="gh-publist">
              {open.map((g) => (
                <li key={g.code}>
                  <Link href={`/groups/${g.code}`} className="gh-row">
                    <span className="gh-name">
                      <b>{g.name} <Vis v="public" /></b>
                      <span className="grp-mute">
                        {g.members} {g.members === 1 ? 'member' : 'members'}{g.owner ? ` · made by ${g.owner}` : ''}
                      </span>
                    </span>
                    <span className={`grp-pill ${g.full ? 'wait' : 'line'}`}>{g.full ? 'Full' : 'Join'}</span>
                  </Link>
                </li>
              ))}
              {closed.map((g, i) => (
                <li key={'p' + i}>
                  <div className="gh-row gh-locked">
                    <span className="gh-name">
                      <b>{g.name} <Vis v="private" /></b>
                      <span className="grp-mute">{g.members} {g.members === 1 ? 'member' : 'members'}</span>
                    </span>
                    <span className="grp-pill wait">{g.full ? 'Full' : 'Invite only'}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}
    </GroupsShell>
  );
}

// PUBLIC OR PRIVATE, on every group row (owner, 2026-09-25). Public: listed
// here and joinable in one tap. Private: invite only, by link or code.
function Vis({ v }) {
  const pub = v === 'public';
  return (
    <span className={'gh-vis' + (pub ? ' pub' : '')} title={pub ? 'Listed here; anyone can join' : 'Invite only: joined by link or code'}>
      {pub ? 'Public' : 'Private'}
    </span>
  );
}

// One line on the create form. Off by default: a group is invite only unless
// its owner says otherwise, and the owner can change it later in Members.
function PublicToggle({ on, set }) {
  return (
    <label className="gh-pubtog">
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
      <span>List it publicly, so anyone can find and join it</span>
    </label>
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
.gh-locked{cursor:default;}
.gh-locked:hover b{color:var(--stg-ink);}
.gh-name{display:flex;flex-direction:column;min-width:0;font-size:13px;}
.gh-name b{font-size:15px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.gh-code{margin-top:16px;padding-top:14px;border-top:1px solid var(--stg-line);display:flex;flex-direction:column;gap:8px;}
.gh-code .grp-in{flex:1;}
.gh-form{display:flex;flex-direction:column;gap:8px;margin-top:10px;}
.gh-form .grp-btn{align-self:flex-start;margin-top:6px;}
.gh-small{font-size:12px;}
.gh-pub{margin-top:16px;}
.gh-publist{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));column-gap:24px;}
.gh-publist li{border-top:1px solid var(--stg-line);}
.gh-vis{display:inline-block;vertical-align:2px;margin-left:6px;padding:1px 6px;border-radius:999px;
  border:1px solid var(--stg-line2);font-family:ui-monospace,Menlo,monospace;font-size:9px;font-weight:500;
  letter-spacing:.1em;text-transform:uppercase;color:var(--stg-mute);}
.gh-vis.pub{border-color:var(--stg-acc);color:var(--stg-acc-ink);}
.gh-pubtog{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:var(--stg-ink2);margin-top:2px;cursor:pointer;}
.gh-pubtog input{margin-top:2px;accent-color:var(--stg-acc);}
@media(max-width:800px){.gh-grid{grid-template-columns:1fr;}}
`;
