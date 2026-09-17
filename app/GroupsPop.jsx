"use client";

// GroupsPop — the one-time launch card for Groups (owner, 2026-09-17).
//
// ONCE PER BROWSER, FOR EVERYONE, ON THE HOME ONLY. Guests and signed-in
// players alike. `sot_groups_pop` is stamped the moment it renders, so it never
// comes back, including after a close.
//
// SKIPPED for a reader who is already in a group: they found the feature
// without being told. That is one small read of /api/groups, which answers a
// guest with no database call at all.
//
// IT WAITS ITS TURN, the same way PremierePop does: the first-visit light
// switch demo, the daily arrival screen, the first-visit welcome and the
// new-game card each own the load while they are up, and this polls until none
// is on screen. It gives up after 20 seconds rather than open onto a page the
// reader has started using.
//
// FEEDBACK flips the card to a short form that posts to /api/complaints
// (listId 'groups-feedback'), so it lands in the admin Feedback tab.
//
// ?groupspop=1 previews without stamping; ?groupspop=0 suppresses.
// Stage tokens only, so it follows the light switch.

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const KEY = 'sot_groups_pop';

function busy() {
  try {
    if (!localStorage.getItem('sot_theme_intro2')) return true;   // the intro is running or about to
  } catch (e) {}
  return !!document.querySelector('.stw.up, .stw.shrink, .prm-scrim, .mlw-scrim');
}

function savedEmail() {
  try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); return (id && id.email) || ''; } catch (e) { return ''; }
}

export default function GroupsPop() {
  const [open, setOpen] = useState(false);
  const [face, setFace] = useState('intro');
  const [msg, setMsg] = useState('');
  const [mail, setMail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    let force = false;
    try {
      const q = new URLSearchParams(window.location.search).get('groupspop');
      if (q === '0') return undefined;
      force = q === '1';
      if (!force && localStorage.getItem(KEY)) return undefined;
    } catch (e) { return undefined; }

    const timers = [];
    const go = () => {
      const started = Date.now();
      const tick = () => {
        if (!alive) return;
        if (busy()) {
          if (Date.now() - started < 20000) timers.push(setTimeout(tick, 400));
          return;
        }
        if (!force) { try { localStorage.setItem(KEY, new Date().toISOString().slice(0, 10)); } catch (e) {} }
        setMail(savedEmail());
        setOpen(true);
      };
      // The new-game card decides after its own day-status read; give it a
      // head start so the two never open together.
      timers.push(setTimeout(tick, 3500));
    };

    if (force) { go(); return () => { alive = false; timers.forEach(clearTimeout); }; }

    // Already in a group? Then they know. A failed read shows the card anyway.
    let q = '';
    try {
      const p = new URLSearchParams();
      const anon = localStorage.getItem('sot_quiz_anon');
      const email = savedEmail();
      if (anon) p.set('anonId', anon);
      if (email) p.set('email', email);
      q = p.toString();
    } catch (e) {}
    fetch(`/api/groups?${q}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d && d.available === false) return;            // tables not there: say nothing yet
        if (d && Array.isArray(d.groups) && d.groups.length) {
          try { localStorage.setItem(KEY, 'member'); } catch (e) {}
          return;
        }
        go();
      })
      .catch(() => { if (alive) go(); });
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);

  async function send() {
    if (sending || !msg.trim()) return;
    setSending(true);
    let anon = '';
    try { anon = localStorage.getItem('sot_quiz_anon') || ''; } catch (e) {}
    try {
      await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: 'groups-feedback',
          listTitle: 'Groups: launch feedback',
          message: `${msg.trim()}\n\n---\nFrom the Groups launch pop-up\nBrowser id: ${anon || '(none)'}`,
          email: mail.trim(),
        }),
      });
    } catch (e) { /* acknowledge either way */ }
    setSending(false);
    setSent(true);
  }

  if (!open) return null;
  const close = () => setOpen(false);

  return (
    <div className="gpp-scrim" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="gpp" role="dialog" aria-modal="true" aria-labelledby="gpp-t" onClick={(e) => e.stopPropagation()}>
        <button className="gpp-x" type="button" aria-label="Close" onClick={close}><X size={16} /></button>
        {face === 'intro' ? (
          <>
            <div className="gpp-eye"><i><b className="c1" /><b className="c2" /><b className="c3" /></i><span>New · Groups</span></div>
            <h2 id="gpp-t">Play with and against friends, family, and coworkers <em>(and enemies?)</em></h2>
            <p className="gpp-lede">Try our new <b>Groups</b> feature. Start a group, send one link, and everyone gets a private daily leaderboard on the puzzles you already play.</p>
            <div className="gpp-mini" aria-label="Example group leaderboard">
              <div className="gpp-mh"><b>The Tuesday Trivia Crew</b><span>Example</span></div>
              <div className="gpp-row"><span className="rk first">1</span><span className="av a1">PA</span><span className="nm">puzzlepat</span><span className="pt">212</span></div>
              <div className="gpp-row"><span className="rk">2</span><span className="av a2">YO</span><span className="nm">You</span><span className="pt">188</span></div>
              <div className="gpp-row"><span className="rk">3</span><span className="av a3">KB</span><span className="nm">KBrewer</span><span className="pt">161</span></div>
            </div>
            <div className="gpp-acts">
              <a className="gpp-btn solid" href="/groups" onClick={close}>Start a group</a>
              <a className="gpp-btn" href="/groups#gh-code" onClick={close}>Have a code?</a>
            </div>
            <div className="gpp-foot">
              <span>Groups lives in the home header</span>
              <button type="button" className="gpp-fb" onClick={() => setFace('feedback')}>Please share any feedback</button>
            </div>
          </>
        ) : sent ? (
          <>
            <div className="gpp-eye"><span>Groups · Feedback</span></div>
            <h2 id="gpp-t">Thanks, that went to the editors.</h2>
            <p className="gpp-lede">We read every note. If you left an email, we can write back.</p>
            <div className="gpp-acts">
              <a className="gpp-btn solid" href="/groups" onClick={close}>Try Groups</a>
              <button type="button" className="gpp-btn" onClick={close}>Close</button>
            </div>
          </>
        ) : (
          <>
            <div className="gpp-eye"><span>Groups · Feedback</span></div>
            <h2 id="gpp-t">What would make Groups better?</h2>
            <p className="gpp-lede">Ideas, bugs, anything missing. It goes straight to the editors.</p>
            <div className="gpp-form">
              <label htmlFor="gpp-msg">Your feedback</label>
              <textarea id="gpp-msg" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. a weekly winner would be fun" />
              <label htmlFor="gpp-mail">Email (optional, if you want a reply)</label>
              <input id="gpp-mail" type="email" value={mail} onChange={(e) => setMail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="gpp-acts">
              <button type="button" className="gpp-btn solid" disabled={!msg.trim() || sending} onClick={send}>{sending ? 'Sending…' : 'Send feedback'}</button>
              <button type="button" className="gpp-btn" onClick={() => setFace('intro')}>Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const CSS = `
.gpp-scrim{position:fixed;inset:0;z-index:8000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(11,15,26,.55);}
.gpp{width:min(460px,100%);max-height:calc(100vh - 36px);overflow:auto;background:var(--stg-raise,#fff);color:var(--stg-ink,#0b0d12);
  border:1px solid var(--stg-line2,rgba(11,15,26,.24));border-radius:16px;padding:22px 22px 16px;position:relative;
  box-shadow:0 24px 60px -20px rgba(0,0,0,.45);animation:gpp-in .3s ease-out;font-family:Manrope,system-ui,sans-serif;}
@keyframes gpp-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.gpp{animation:none}}
.gpp-x{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:8px;border:0;background:transparent;color:var(--stg-mute,#5f6774);cursor:pointer;display:grid;place-items:center;}
.gpp-x:hover{background:var(--stg-surf2,#e4e9f1);color:var(--stg-ink,#0b0d12);}
.gpp-eye{font:500 11px "DM Mono",ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute,#5f6774);display:flex;align-items:center;gap:8px;}
.gpp-eye i{display:inline-flex;gap:2px;}
.gpp-eye b{width:6px;height:6px;border-radius:2px;display:block;}
.gpp-eye .c1{background:#7dd3fc}.gpp-eye .c2{background:#6ee7b7}.gpp-eye .c3{background:#fb923c}
.gpp h2{font-size:23px;font-weight:800;letter-spacing:-.015em;line-height:1.15;margin:8px 0 6px;padding-right:24px;text-wrap:balance;}
.gpp h2 em{font-style:normal;font-weight:700;color:var(--stg-mute,#5f6774);}
.gpp-lede{color:var(--stg-ink2,#3f4757);font-size:13.5px;line-height:1.5;margin:0 0 14px;}
.gpp-lede b{color:var(--stg-ink,#0b0d12);}
.gpp-mini{border:1px solid var(--stg-line,rgba(11,15,26,.14));background:var(--stg-surf,#fff);border-radius:12px;padding:10px 12px;position:relative;overflow:hidden;}
.gpp-mini::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--stg-acc,#2563eb);}
.gpp-mh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;}
.gpp-mh b{font-size:13.5px;font-weight:800;}
.gpp-mh span{font:500 10px "DM Mono",ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute,#5f6774);}
.gpp-row{display:grid;grid-template-columns:26px 26px 1fr auto;gap:8px;align-items:center;padding:6px 0;border-top:1px solid var(--stg-line,rgba(11,15,26,.14));font-size:13.5px;}
.gpp-row .rk{font:500 12px "DM Mono",ui-monospace,monospace;color:var(--stg-mute,#5f6774);}
.gpp-row .rk.first{color:var(--stg-ink,#0b0d12);}
.gpp-row .rk.first::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#e8b43a;margin-right:4px;vertical-align:1px;}
.gpp-row .av{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:800;color:#08222e;}
.gpp-row .a1{background:#7dd3fc}.gpp-row .a2{background:#6ee7b7}.gpp-row .a3{background:#fb7185}
.gpp-row .nm{font-weight:700;}
.gpp-row .pt{font-weight:800;font-variant-numeric:tabular-nums;}
.gpp-acts{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;}
.gpp-btn{border-radius:999px;padding:10px 16px;font:inherit;font-size:14px;font-weight:800;border:1px solid var(--stg-line2,rgba(11,15,26,.24));background:none;color:var(--stg-ink,#0b0d12);text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;}
.gpp-btn.solid{background:var(--stg-acc,#2563eb);border-color:var(--stg-acc,#2563eb);color:var(--stg-onramp,#fff);flex:1 1 auto;}
.gpp-btn:disabled{opacity:.5;cursor:default;}
.gpp-btn:focus-visible,.gpp-x:focus-visible,.gpp-fb:focus-visible{outline:2px solid var(--stg-acc,#2563eb);outline-offset:2px;}
.gpp-foot{margin-top:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;font:400 11px "DM Mono",ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--stg-mute,#5f6774);}
.gpp-fb{background:none;border:0;padding:0;font:700 12px Manrope,system-ui,sans-serif;color:var(--stg-acc-ink,#2563eb);text-decoration:underline;text-underline-offset:3px;cursor:pointer;}
.gpp-form{display:flex;flex-direction:column;gap:6px;}
.gpp-form label{font:500 10px "DM Mono",ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute,#5f6774);margin-top:4px;}
.gpp-form textarea,.gpp-form input{font:inherit;font-size:14px;border:1px solid var(--stg-cell-line,rgba(11,15,26,.44));border-radius:10px;padding:9px 12px;background:var(--stg-cell,#fff);color:var(--stg-ink,#0b0d12);}
.gpp-form textarea{min-height:92px;resize:vertical;}
@media (max-width:560px){
  .gpp-scrim{align-items:flex-end;padding:0;}
  .gpp{width:100%;border-radius:22px 22px 0 0;border-bottom:0;padding:20px 18px 22px;max-height:92vh;}
  .gpp-btn{flex:1 1 100%;}
}
`;
