'use client';
// CHOOSE A NAME, on the home (owner report, 2026-09-17: "the choose a name
// feature is broken - when you select it without a name it defaults to flicking
// the screen but no option to choose a name").
//
// WHAT WAS BROKEN. Three controls pointed at `/?signup=1` — the cap's guest
// chip and the My games tile on the stage home, plus the Quizzes landing page —
// and NOTHING on the home ever read that parameter. So the link reloaded the
// home, the arrival screen played again (the "flicking"), and the reader was
// left exactly where they started with no form anywhere.
//
// This is that form. It opens two ways, so every one of those controls works:
//   - `?signup=1` in the URL, which is what the old links already say;
//   - the `sot:choose-name` window event, which the two controls on this page
//     fire instead of navigating, so a reader who is already here gets the form
//     without the page reloading under them.
//
// The form itself is JoinLeaderboardForm, the site's one join form (the same
// one the finish card's claim tile uses), so the rules about names, emails and
// locked-out accounts are stated in one place. On success the page reloads
// WITHOUT the parameter: the cap, the boards and the ladder all read the new
// identity on the way back, which is simpler and more honest than patching a
// dozen pieces of state in place.
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import JoinLeaderboardForm from './quiz/[id]/JoinLeaderboardForm';

export const CHOOSE_NAME_EVENT = 'sot:choose-name';

export function openChooseName() {
  if (typeof window === 'undefined') return;
  try { window.dispatchEvent(new CustomEvent(CHOOSE_NAME_EVENT)); } catch (e) {}
}

export default function ChooseNamePop() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('signup') === '1') setOpen(true);
    } catch (e) {}
    const onAsk = () => setOpen(true);
    window.addEventListener(CHOOSE_NAME_EVENT, onAsk);
    return () => window.removeEventListener(CHOOSE_NAME_EVENT, onAsk);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    // Drop ?signup=1 so a refresh does not reopen it.
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.has('signup')) {
        u.searchParams.delete('signup');
        window.history.replaceState({}, '', u.pathname + (u.search || '') + u.hash);
      }
    } catch (e) {}
  }

  function joined() {
    setDone(true);
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete('signup');
      // `welcome=0` keeps the arrival screen from playing on the way back in,
      // which is the flicker the reader was complaining about.
      u.searchParams.set('welcome', '0');
      window.location.replace(u.pathname + u.search + u.hash);
    } catch (e) { window.location.reload(); }
  }

  if (!open) return null;
  return (
    <div className="cnp-scrim" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cnp" role="dialog" aria-labelledby="cnp-t" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cnp-x" aria-label="Close" onClick={close}><X size={16} /></button>
        <div className="cnp-eye"><i />Mind Loft</div>
        <h2 id="cnp-t">Choose a name</h2>
        <p className="cnp-lede">
          A display name puts you on the daily boards and keeps your stats, streaks and IQ points.
          No password. An email is optional and only there to move your name onto another device.
        </p>
        {done ? (
          <p className="cnp-ok">You&rsquo;re on the board. Loading your day&hellip;</p>
        ) : (
          <div className="cnp-form">
            <JoinLeaderboardForm heading="Choose a name" hideIcon onJoined={joined} />
          </div>
        )}
      </div>
    </div>
  );
}

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const CSS = `
.cnp-scrim{position:fixed;inset:0;z-index:8200;display:flex;align-items:center;justify-content:center;
  padding:18px;background:rgba(11,15,26,.55);}
.cnp{width:min(460px,100%);max-height:calc(100vh - 36px);overflow:auto;position:relative;
  background:var(--stg-raise,#0e131f);color:var(--stg-ink,#e9edf4);
  border:1px solid var(--stg-line2,rgba(255,255,255,.24));border-radius:16px;padding:22px 22px 18px;
  box-shadow:0 24px 60px -20px rgba(0,0,0,.45);font-family:Manrope,system-ui,sans-serif;
  animation:cnp-in .24s ease-out;}
@keyframes cnp-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.cnp{animation:none;}}
.cnp-x{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:8px;border:0;
  background:transparent;color:var(--stg-mute,#8b95a8);cursor:pointer;display:grid;place-items:center;}
.cnp-x:hover{background:var(--stg-surf2,rgba(255,255,255,.08));color:var(--stg-ink,#e9edf4);}
.cnp-eye{display:flex;align-items:center;gap:8px;font-family:${MONO};font-size:10.5px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--stg-mute,#8b95a8);}
.cnp-eye i{width:8px;height:8px;border-radius:2px;background:var(--stg-brand,#7dd3fc);}
.cnp h2{margin:8px 0 6px;font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1.1;}
.cnp-lede{margin:0 0 14px;font-size:13.5px;line-height:1.5;color:var(--stg-ink2,#aab5c7);}
.cnp-ok{margin:6px 0 2px;font-size:14px;font-weight:700;color:var(--stg-up,#6ee7b7);}
/* The shared join form inks itself from these, which .stage-page publishes on
   the game pages; the home has no category accent, so the brand answers. */
.cnp-form{--join-head:var(--stg-ink,#e9edf4);--join-body:var(--stg-ink2,#aab5c7);
  --join-soft:var(--stg-mute,#8b95a8);--join-ok:var(--stg-up,#6ee7b7);--join-err:var(--stg-bad,#fb7185);
  --join-cta:var(--stg-brand,#7dd3fc);--join-cta-ink:var(--stg-raise,#0e131f);
  --join-field-bg:var(--stg-surf,rgba(255,255,255,.045));--join-field-ink:var(--stg-ink,#e9edf4);
  --join-field-line:var(--stg-line2,rgba(255,255,255,.24));}
/* The shared form carries its own heading and opening line, which this card has
   already said; both are hidden here rather than forked into a second form.
   The heading row sets display:flex INLINE, and inline beats a stylesheet at
   any specificity, so this one declaration has to shout. */
.cnp-form #daily-join > div:first-of-type{display:none !important;}
.cnp-form #daily-join > p:first-of-type{display:none;}
.cnp-form #daily-join{max-width:none;}
`;
