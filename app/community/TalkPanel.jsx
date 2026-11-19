'use client';
// ONE PUZZLE'S POST-GAME TALK (owner, 2026-11-18). Used whole on
// /community/talk/<game> and short (`compact`, the three latest posts) in the
// Talk tab of the Full Results page.
//
// The rules it shows, all enforced by /api/community/talk:
//   - closed until you have a result on the puzzle (no spoilers, nothing mid game)
//   - every post carries the poster's real result, taken when they posted
//   - Gentle / Moderate / Tough, one tap a player
//   - a Maker post, when there is one, is pinned first
//   - closes at midnight Eastern; past days stay readable in the archive
//   - Report hides a post at three reports until the admin looks
import React, { useCallback, useEffect, useState } from 'react';
import { getTalk, talkAction, ago, talkHref, suggestHref, todaySuffix } from './communityClient';
import { ensureAccount, readIdentity, suggestName } from '../groups/GroupsShell';
import { FEEL_NAMES, pastelOf } from './communityShared';

function Av({ name }) {
  return <span className="tkp-av" aria-hidden="true" style={{ '--av': pastelOf(name) }}>{String(name || '?').slice(0, 2).toUpperCase()}</span>;
}

export default function TalkPanel({ gameKey, gameName = '', day = null, compact = false, playHref = null, onCount = null }) {
  const d0 = day || todaySuffix();
  const [data, setData] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [nm, setNm] = useState('');
  const load = useCallback(() => {
    getTalk(gameKey, d0).then((d) => { setData(d); if (onCount && d && typeof d.talkers === 'number') onCount(d.talkers); });
  }, [gameKey, d0]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setNm(readIdentity().username || suggestName()); load(); }, [load]);

  const name = gameName || (data && data.game && data.game.name) || 'this puzzle';
  const isToday = d0 === todaySuffix();

  if (!data) return <div className={'tkp' + (compact ? ' tkp-c' : '')}><style dangerouslySetInnerHTML={{ __html: CSS }} /><p className="tkp-note">Loading the discussion&hellip;</p></div>;
  if (data.available === false) return <div className={'tkp' + (compact ? ' tkp-c' : '')}><style dangerouslySetInnerHTML={{ __html: CSS }} /><p className="tkp-note">The community is being set up. Check back soon.</p></div>;
  if (data.failed || data.error) return <div className={'tkp' + (compact ? ' tkp-c' : '')}><style dangerouslySetInnerHTML={{ __html: CSS }} /><p className="tkp-note">{data.error || 'Could not load the discussion. Try again in a moment.'}</p></div>;

  if (!data.played && !data.admin) {
    return (
      <div className={'tkp' + (compact ? ' tkp-c' : '')}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="tkp-lock">
          <b>Finish {isToday ? 'today’s' : 'this'} {name} to open its discussion</b>
          <span>{data.talkers ? `${data.talkers} ${data.talkers === 1 ? 'player is' : 'players are'} talking. ` : ''}Only players who finished can read it, so nobody spoils it for you.</span>
          <a className="tkp-btn go" href={playHref || (data.game && data.game.href) || `/${gameKey}`}>Play {name}</a>
        </div>
      </div>
    );
  }

  const posts = data.posts || [];
  const shown = compact ? [...posts.filter((p) => p.maker), ...posts.filter((p) => !p.maker).slice(-3)] : posts;
  const feel = data.feel || { tally: { 1: 0, 2: 0, 3: 0 }, mine: null };

  const act = async (action, extra) => {
    setErr('');
    const r = await talkAction(gameKey, d0, action, extra);
    if (r && r.error) { setErr(r.error); return null; }
    return r;
  };
  const needName = !data.username && !data.admin;
  const send = async (e) => {
    e.preventDefault();
    if (busy) return;
    const body = text.trim();
    if (!body) { setErr('Write something first.'); return; }
    setBusy(true);
    if (needName) {
      const a = await ensureAccount(nm);
      if (a.error) { setErr(a.error); setBusy(false); return; }
    }
    const r = await act(data.admin && !data.played ? 'maker' : 'post', { body });
    setBusy(false);
    if (r) { setText(''); load(); }
  };
  const tap = async (fn) => { if (needName) { setErr('Pick a name below first, then post or cheer.'); return; } if (await fn()) load(); };

  return (
    <div className={'tkp' + (compact ? ' tkp-c' : '')}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {data.result ? <div className="tkp-you">Your result: <b>{data.result}</b>{isToday ? ' · Closes at midnight Eastern' : ''}</div> : null}
      <div className="tkp-feel">
        <span>How did it feel?</span>
        <div className="tkp-seg" role="group" aria-label="How did it feel">
          {[1, 2, 3].map((f) => (
            <button key={f} type="button" className={feel.mine === f ? 'on' : ''} aria-pressed={feel.mine === f}
              onClick={() => tap(() => act('feel', { feel: f }))}>
              {FEEL_NAMES[f]} <i>{feel.tally ? feel.tally[f] || 0 : 0}</i>
            </button>
          ))}
        </div>
      </div>
      {shown.length ? (
        <ul className="tkp-list">
          {shown.map((p) => (
            <li key={p.id} className={'tkp-post' + (p.maker ? ' mk' : '') + (p.hidden ? ' hid' : '')}>
              {p.maker ? <span className="tkp-mk">Maker</span> : <Av name={p.name} />}
              <div className="tkp-pb">
                <div className="tkp-ph">
                  <b>{p.mine ? 'You' : p.name}</b>
                  {p.result ? <span className="tkp-res">{p.result}</span> : null}
                  <span className="tkp-at">{ago(p.at)}</span>
                  {p.hidden ? <span className="tkp-res">Hidden{p.reports ? ` · ${p.reports} reports` : ''}</span> : null}
                </div>
                <p>{p.body}</p>
                {!p.maker ? (
                  <div className="tkp-acts">
                    <button type="button" className={p.cheered ? 'on' : ''} aria-pressed={p.cheered}
                      onClick={() => tap(() => act('cheer', { id: p.id, on: !p.cheered }))}>Cheer{p.cheers ? ` ${p.cheers}` : ''}</button>
                    {!p.mine ? <button type="button" onClick={() => tap(async () => { const r = await act('report', { id: p.id }); if (r) setErr('Thanks. The post was reported.'); return r; })}>Report</button> : null}
                    {data.admin ? <button type="button" onClick={async () => { if (await act('hide', { id: p.id, hidden: !p.hidden })) load(); }}>{p.hidden ? 'Restore' : 'Hide'}</button> : null}
                  </div>
                ) : data.admin ? (
                  <div className="tkp-acts"><button type="button" onClick={async () => { if (await act('hide', { id: p.id, hidden: !p.hidden })) load(); }}>{p.hidden ? 'Restore' : 'Hide'}</button></div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="tkp-note">No posts yet. Say how it went, or share the move that cracked it.</p>}
      {compact && posts.filter((p) => !p.maker).length > 3 ? <a className="tkp-more" href={talkHref(gameKey, d0)}>See all {posts.filter((p) => !p.maker).length} posts</a> : null}
      {(data.canPost || needName) && isToday ? (
        <form className="tkp-form" onSubmit={send}>
          {needName ? (
            <label className="tkp-name">Your name on the board
              <input value={nm} maxLength={15} onChange={(e) => setNm(e.target.value)} />
            </label>
          ) : null}
          <div className="tkp-row">
            <textarea value={text} maxLength={data.max || 600} rows={compact ? 1 : 3} placeholder={data.admin && !data.played ? 'Write the Maker post for this puzzle' : `Add to the discussion. Your ${data.result || 'result'} shows next to your name.`}
              onChange={(e) => setText(e.target.value)} aria-label="Your post" />
            <button type="submit" className="tkp-btn go" disabled={busy}>{busy ? 'Posting…' : 'Post'}</button>
          </div>
        </form>
      ) : !isToday ? <p className="tkp-note">This discussion closed at midnight. It stays here to read.</p> : null}
      {err ? <p className="tkp-err" role="status">{err}</p> : null}
      {compact ? (
        <div className="tkp-two">
          <a className="tkp-btn go" href={talkHref(gameKey, d0)}>See The Discussion</a>
          <a className="tkp-btn" href={suggestHref(gameKey)}>Suggest A {name} Idea</a>
        </div>
      ) : null}
      {compact ? <p className="tkp-note sm">Closes at midnight and moves to the archive. Only players who finished can read or post.</p> : null}
    </div>
  );
}

const CSS = `
.tkp{--tk-ink:var(--sst-ink,var(--stg-ink,#0b0d12));--tk-raise:var(--stg-raise,#ffffff);--tk-line:color-mix(in srgb,var(--tk-ink) 16%,transparent);
  --tk-acc:var(--sst-bg,#a6f4e7);color:var(--tk-ink);display:flex;flex-direction:column;gap:12px;font-family:inherit;text-align:left;}
.tkp-note{margin:0;font-size:14px;font-weight:600;line-height:1.45;opacity:.8;}
.tkp-note.sm{font-size:12px;opacity:.65;}
.tkp-err{margin:0;font-size:13px;font-weight:700;color:var(--stg-bad,#b42318);}
.tkp-you{font-size:13px;font-weight:700;opacity:.85;}
.tkp-you b{font-weight:800;}
.tkp-lock{display:flex;flex-direction:column;gap:8px;align-items:flex-start;border:1px solid var(--tk-ink);border-radius:14px;padding:16px;background:var(--tk-raise);}
.tkp-lock b{font-size:17px;font-weight:800;line-height:1.3;}
.tkp-lock span{font-size:14px;font-weight:600;line-height:1.45;opacity:.85;}
.tkp-feel{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.tkp-feel > span{font-size:13.5px;font-weight:800;}
.tkp-seg{display:flex;border:1px solid var(--tk-ink);border-radius:999px;overflow:hidden;background:var(--tk-raise);}
.tkp-seg button{border:0;border-left:1px solid var(--tk-ink);background:transparent;color:var(--tk-ink);font:inherit;font-size:13px;font-weight:800;
  min-height:36px;padding:0 14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}
.tkp-seg button:first-child{border-left:0;}
.tkp-seg button i{font-style:normal;font-weight:600;opacity:.75;}
.tkp-seg button.on{background:var(--tk-acc);}
.tkp-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;}
.tkp-post{display:flex;gap:12px;padding:12px 0;border-top:1px solid var(--tk-line);}
.tkp-post:first-child{border-top:0;}
.tkp-post.mk{border:1px solid var(--tk-ink);border-radius:12px;padding:12px 14px;background:color-mix(in srgb,var(--tk-acc) 35%,var(--tk-raise));margin-bottom:6px;}
.tkp-post.hid{opacity:.55;}
.tkp-av{flex:none;width:34px;height:34px;box-sizing:border-box;border-radius:50%;border:1px solid var(--tk-ink);display:inline-flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:800;line-height:1;color:#08222e;background:var(--av);}
.stage-page:not([data-stage-theme=light]) .tkp-av{background:color-mix(in srgb,var(--av) 30%,transparent);color:var(--tk-ink);}
.tkp-mk{flex:none;align-self:flex-start;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--tk-ink);border-radius:999px;padding:2px 9px;background:var(--tk-raise);}
.tkp-pb{flex:1;min-width:0;}
.tkp-ph{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.tkp-ph b{font-size:14px;font-weight:800;}
.tkp-res{font-size:11.5px;font-weight:800;border:1px solid var(--tk-ink);border-radius:999px;padding:1px 8px;line-height:1.4;}
.tkp-at{font-size:12px;font-weight:600;opacity:.6;}
.tkp-pb p{margin:4px 0 0;font-size:14.5px;font-weight:600;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere;}
.tkp-acts{display:flex;gap:14px;margin-top:6px;}
.tkp-acts button{border:0;background:none;padding:2px 0;font:inherit;font-size:12.5px;font-weight:800;color:var(--tk-ink);opacity:.65;cursor:pointer;}
.tkp-acts button:hover,.tkp-acts button.on{opacity:1;}
.tkp-acts button.on{text-decoration:underline;text-underline-offset:3px;}
.tkp-more{font-size:13.5px;font-weight:800;color:var(--tk-ink);}
.tkp-form{display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--tk-line);padding-top:12px;}
.tkp-name{display:flex;flex-direction:column;gap:4px;font-size:12.5px;font-weight:800;}
.tkp-name input{font:inherit;font-size:14px;font-weight:600;border:1px solid var(--tk-ink);border-radius:10px;padding:9px 12px;background:var(--tk-raise);color:var(--tk-ink);max-width:260px;}
.tkp-row{display:flex;gap:10px;align-items:flex-start;}
.tkp-row textarea{flex:1;min-width:0;font:inherit;font-size:14.5px;font-weight:600;line-height:1.4;border:1px solid var(--tk-ink);border-radius:10px;padding:10px 12px;
  background:var(--tk-raise);color:var(--tk-ink);resize:vertical;min-height:44px;}
.tkp-row textarea::placeholder{color:color-mix(in srgb,var(--tk-ink) 55%,transparent);}
.tkp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;box-sizing:border-box;border-radius:10px;border:1px solid var(--tk-ink);
  background:var(--tk-raise);color:var(--tk-ink) !important;font:inherit;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer;white-space:nowrap;}
.tkp-btn.go{background:var(--tk-ink);color:var(--tk-raise) !important;}
.tkp-btn:disabled{opacity:.6;cursor:default;}
.tkp-btn:focus-visible,.tkp-seg button:focus-visible,.tkp-acts button:focus-visible,.tkp-row textarea:focus-visible{outline:2px solid var(--tk-ink);outline-offset:2px;}
.tkp-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;border-top:1px solid var(--tk-line);padding-top:12px;}
.tkp-c .tkp-av{width:30px;height:30px;font-size:10px;}
@media (max-width:560px){ .tkp-two{grid-template-columns:1fr;} .tkp-seg{width:100%;} .tkp-seg button{flex:1;justify-content:center;padding:0 6px;} }
`;
