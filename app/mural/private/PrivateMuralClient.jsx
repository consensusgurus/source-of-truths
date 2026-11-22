'use client';

import { useCallback, useEffect, useState } from 'react';
import { focusStyle } from '@/lib/photo-focus';

// The start and share page for private murals (owner, 2026-11-19: "you start them
// via a button on menu of puzzle itself 'private mural' that takes you to the
// share page"). One screen: who it is for, how big, which picture, Start; then
// the link to send. Below, the private murals this player started or can play
// through a group. Rules live in /api/mural/private and lib/mural.js.

const CSS = `
.pm{--pg:#f5f4f0;--card:#ffffff;--ink:#15171c;--mute:#5d6470;--soft:#e9e7e1;--tint:#f1affb;min-height:100vh;background:var(--pg);color:var(--ink);font-family:'Manrope',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.pm.dark{--pg:#0f1218;--card:#171b23;--ink:#eef1f6;--mute:#98a2b3;--soft:#252b36;--tint:#5a3566}
.pm *{box-sizing:border-box}
.pm-in{max-width:880px;margin:0 auto;padding:14px 16px 56px}
.pm-top{display:flex;align-items:center;gap:16px;min-height:36px}
.pm-top .sp{flex:1}
.pm-home{display:inline-flex;align-items:center;gap:7px;color:var(--ink);text-decoration:none;font:800 15px/1.3 'Manrope',sans-serif}
.pm-txt{color:var(--ink);font:800 13.5px/1.3 'Manrope',sans-serif;text-decoration:none}
.pm-txt:hover{text-decoration:underline;text-underline-offset:3px}
.pm h1{margin:18px 0 6px;font:800 clamp(32px,6vw,54px)/1.12 'Manrope',sans-serif;letter-spacing:-.035em}
.pm-lede{margin:0 0 18px;max-width:640px;font:600 16px/1.5 'Manrope',sans-serif;color:var(--mute)}
.pm-card{border:1px solid var(--ink);border-radius:16px;background:var(--card);padding:16px 18px 18px;margin:0 0 16px}
.pm-card.share{background:var(--tint)}
.pm.dark .pm-card.share{color:var(--ink)}
.pm h2{margin:0 0 4px;font:800 20px/1.3 'Manrope',sans-serif;letter-spacing:-.01em}
.pm h3{margin:18px 0 8px;font:800 11.5px/1.5 'Manrope',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
.pm h3:first-of-type{margin-top:10px}
.pm p{margin:0 0 10px;font:600 14.5px/1.5 'Manrope',sans-serif}
.pm-note{color:var(--mute)}
.pm-opts{display:flex;flex-wrap:wrap;gap:8px}
.pm-opt{appearance:none;border:1px solid var(--ink);background:var(--card);color:var(--ink);border-radius:999px;padding:9px 16px;font:800 14px/1.3 'Manrope',sans-serif;cursor:pointer;white-space:nowrap}
.pm-opt.on{background:var(--ink);color:var(--card)}
.pm-pics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.pm-pic{appearance:none;display:block;padding:0;border:1px solid var(--ink);border-radius:12px;overflow:hidden;background:var(--soft);cursor:pointer;color:var(--ink);text-align:left}
.pm-pic img{display:block;width:100%;aspect-ratio:8/5;object-fit:cover}
.pm-pic span{display:block;padding:7px 10px 8px;font:700 12.5px/1.35 'Manrope',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pm-pic.on{outline:3px solid var(--ink);outline-offset:1px}
.pm-go{appearance:none;display:block;width:100%;margin-top:18px;border:1px solid var(--ink);background:var(--ink);color:var(--card);border-radius:999px;padding:15px 18px;font:800 16px/1.25 'Manrope',sans-serif;cursor:pointer;text-align:center;text-decoration:none}
.pm-go:disabled{opacity:.45;cursor:default}
.pm-btn{appearance:none;display:inline-block;border:1px solid var(--ink);background:var(--card);color:var(--ink);border-radius:999px;padding:10px 16px;font:800 13.5px/1.25 'Manrope',sans-serif;cursor:pointer;text-decoration:none;white-space:nowrap}
.pm-btn.ink{background:var(--ink);color:var(--card)}
.pm-link{display:block;border:1px solid var(--ink);border-radius:12px;background:var(--card);color:var(--ink);padding:12px 14px;font:800 16px/1.4 'Manrope',sans-serif;overflow-wrap:anywhere;margin:8px 0 12px}
.pm.dark .pm-link{background:#0f1218}
.pm-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.pm-err{margin:12px 0 0;font:700 14px/1.45 'Manrope',sans-serif}
.pm-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.pm-item{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;border:1px solid var(--ink);border-radius:14px;background:var(--card);padding:12px 14px}
.pm-item .t{flex:1 1 220px;min-width:0}
.pm-item b{display:block;font:800 15.5px/1.35 'Manrope',sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pm-item small{display:block;font:600 13px/1.45 'Manrope',sans-serif;color:var(--mute)}
.pm-bar{height:8px;border:1px solid var(--ink);border-radius:999px;overflow:hidden;margin-top:6px;background:var(--soft)}
.pm-bar i{display:block;height:100%;background:var(--ink)}
@media (max-width:560px){.pm-pics{grid-template-columns:1fr 1fr}.pm-pic:nth-child(3){grid-column:1 / -1}}
`;

function anonId() {
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) {
      a = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem('sot_quiz_anon', a);
    }
    return a;
  } catch (e) { return ''; }
}
function email() {
  try { const j = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); return j && j.email ? String(j.email) : ''; } catch (e) { return ''; }
}
const num = (n) => Number(n || 0).toLocaleString('en-US');

export default function PrivateMuralClient() {
  const [dark, setDark] = useState(false);
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [group, setGroup] = useState('');       // '' = anyone with the link, else a group's code
  const [size, setSize] = useState('m');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [made, setMade] = useState(null);       // { code }
  const [copied, setCopied] = useState('');

  const load = useCallback((seed, pin) => {
    const q = `anonId=${encodeURIComponent(anonId())}${email() ? `&email=${encodeURIComponent(email())}` : ''}&seed=${encodeURIComponent(seed)}${pin ? `&photo=${pin}` : ''}`;
    return fetch(`/api/mural/private?${q}`).then((r) => r.json())
      .then((j) => { if (j && j.options) { setData(j); setFailed(false); } else setFailed(true); return j; })
      .catch(() => setFailed(true));
  }, []);
  useEffect(() => {
    try { setDark(localStorage.getItem('sot_theme2') === 'dark'); } catch (e) { /* light */ }
    // A picture and size picked on the Jigsaw Puzzles page (?photo=12&size=m)
    // arrive chosen; the server lists that picture first when it may be used.
    let pin = null;
    try {
      const sp = new URLSearchParams(window.location.search);
      const p = Number(sp.get('photo'));
      if (Number.isInteger(p) && p > 0) pin = p;
      const sz = sp.get('size');
      if (sz && /^(s|m|l|xl)$/.test(sz)) setSize(sz);
    } catch (e) { /* no query */ }
    load(String(Date.now()), pin).then((j) => { if (pin && j && Array.isArray(j.options) && j.options.some((o) => o.n === pin)) setPhoto(pin); });
  }, [load]);

  const linkFor = (code) => `${typeof window !== 'undefined' ? window.location.origin : 'https://mindloftdaily.com'}/mural/p/${code}`;
  const copy = (code) => {
    const link = linkFor(code);
    const done = () => { setCopied(code); setTimeout(() => setCopied((c) => (c === code ? '' : c)), 2200); };
    try { navigator.clipboard.writeText(link).then(done, () => {}); } catch (e) { /* the link is on the page to copy by hand */ }
  };
  const others = () => { setPhoto(null); load(String(Date.now())); };
  const start = () => {
    if (busy || !photo) return;
    setBusy(true); setErr('');
    fetch('/api/mural/private', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size, photo, group: group || undefined, anonId: anonId(), email: email() || undefined }),
    }).then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (ok && j && j.code) { setMade({ code: j.code }); setPhoto(null); load(String(Date.now())); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { /* no scroll */ } }
        else setErr((j && j.message) || 'That did not work. Try again.');
      })
      .catch(() => setErr('That did not work. Check your connection and try again.'))
      .then(() => setBusy(false));
  };

  const sizes = (data && data.sizes) || [];
  const groups = (data && data.groups) || [];
  const murals = (data && data.murals) || [];
  const groupName = (code) => (groups.find((g) => g.code === code) || {}).name || 'your group';

  return (
    <div className={`pm${dark ? ' dark' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pm-in">
        <div className="pm-top">
          <a className="pm-home" href="/" aria-label="Back to Mind Loft home">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            <svg width="22" height="22" viewBox="0 0 26 26" aria-hidden="true"><path d="M3 22V11l10-8 10 8v11h-5v-8l-5 5-5-5v8z" fill="currentColor" /></svg>
            <span>Mind Loft</span>
          </a>
          <span className="sp" />
          <a className="pm-txt" href="/mural">Mural</a>
          <a className="pm-txt" href="/jig/shelf?tab=murals">Jigsaw Puzzles</a>
        </div>

        <h1>Private Mural</h1>
        <p className="pm-lede">A jigsaw you build with the people you choose: your group, or anyone you send the link to. Everyone works on the same picture at once, and when the last piece lands you get the wall of who built what.</p>

        {made ? (
          <section className="pm-card share" aria-live="polite">
            <h2>Your Mural Is Ready</h2>
            <p>{group ? `It is open to the members of ${groupName(group)}. Send them this link.` : 'Send this link to anyone you want building it with you.'}</p>
            <span className="pm-link">{linkFor(made.code)}</span>
            <div className="pm-row">
              <button type="button" className="pm-btn ink" onClick={() => copy(made.code)}>{copied === made.code ? 'Link Copied' : 'Copy Link'}</button>
              <a className="pm-btn" href={`/mural/p/${made.code}`}>Open The Mural</a>
            </div>
          </section>
        ) : null}

        <section className="pm-card">
          <h2>Start One</h2>
          {!data && !failed ? <p className="pm-note">Loading.</p> : null}
          {failed ? <p className="pm-note">This page could not load. Reload to try again.</p> : null}
          {data && !data.available ? <p className="pm-note">Private murals are being switched on. Check back shortly.</p> : null}
          {data && data.available && !data.registered ? (
            <>
              <p>Pick a name first, so the wall can say who built it. It is free and takes a moment. Joining a mural someone sent you needs no name at all.</p>
              <a className="pm-go" href="/groups">Pick A Name</a>
            </>
          ) : null}
          {data && data.available && data.registered ? (
            <>
              <h3>Who Builds It</h3>
              <div className="pm-opts" role="group" aria-label="Who builds it">
                <button type="button" className={`pm-opt${group === '' ? ' on' : ''}`} onClick={() => setGroup('')}>Anyone With The Link</button>
                {groups.map((g) => (
                  <button type="button" key={g.code} className={`pm-opt${group === g.code ? ' on' : ''}`} onClick={() => setGroup(g.code)}>{g.name}</button>
                ))}
              </div>
              <p className="pm-note" style={{ marginTop: 8 }}>{group ? `Only members of ${groupName(group)} can place pieces. A group has one mural open at a time.` : (groups.length ? 'Anyone who opens the link can place pieces, with or without a name.' : 'Anyone who opens the link can place pieces, with or without a name. Make a group to keep one to its members.')}</p>

              <h3>How Many Pieces</h3>
              <div className="pm-opts" role="group" aria-label="How many pieces">
                {sizes.map((s) => (
                  <button type="button" key={s.key} className={`pm-opt${size === s.key ? ' on' : ''}`} onClick={() => setSize(s.key)}>{num(s.pieces)}</button>
                ))}
              </div>

              <h3>The Picture</h3>
              <div className="pm-pics">
                {(data.options || []).map((o) => (
                  <button type="button" key={o.n} className={`pm-pic${photo === o.n ? ' on' : ''}`} onClick={() => setPhoto(o.n)} aria-pressed={photo === o.n}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/jig/img?n=${o.n}&w=500`} style={focusStyle('jig', o.n)} alt={o.name || 'A picture to choose'} loading="lazy" />
                    <span>{o.name || 'Picture'}</span>
                  </button>
                ))}
              </div>
              <div className="pm-row" style={{ marginTop: 10 }}>
                <button type="button" className="pm-btn" onClick={others}>Show Three Others</button>
              </div>

              <button type="button" className="pm-go" disabled={busy || !photo} onClick={start}>{busy ? 'Cutting Your Mural' : photo ? 'Start The Mural' : 'Pick A Picture To Start'}</button>
              {err ? <p className="pm-err" role="alert">{err}</p> : null}
              <p className="pm-note" style={{ marginTop: 12 }}>A private mural keeps its own standings and does not count toward your Mind Loft points. You can have {data.max || 3} open at once.</p>
            </>
          ) : null}
        </section>

        {murals.length ? (
          <section>
            <h3>Your Private Murals</h3>
            <ul className="pm-list">
              {murals.map((m) => (
                <li className="pm-item" key={m.code}>
                  <div className="t">
                    <b>{m.title || 'Private Mural'}</b>
                    <small>{num(m.total)} pieces. {m.complete ? 'Finished.' : `${num(m.placed)} placed.`} {m.group ? `For ${m.group}.` : 'Anyone with the link.'} {m.mine ? 'Started by you.' : `Started by ${m.by}.`}</small>
                    <div className="pm-bar" aria-hidden="true"><i style={{ width: `${m.total ? Math.min(100, (m.placed / m.total) * 100) : 0}%` }} /></div>
                  </div>
                  <button type="button" className="pm-btn" onClick={() => copy(m.code)}>{copied === m.code ? 'Link Copied' : 'Copy Link'}</button>
                  <a className="pm-btn ink" href={`/mural/p/${m.code}`}>{m.complete ? 'See The Wall' : 'Play'}</a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
