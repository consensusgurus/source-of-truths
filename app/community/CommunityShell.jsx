'use client';
// THE COMMUNITY FRAME (owner, 2026-11-18): the groups pages' one-row cap (logo,
// Stat Hub, light/dark, owner rule 2026-10-21) and one segmented tab row under
// it, the same on every community page. Every colour is a stage token or a
// site pastel, so both registers work.
import React from 'react';
import Link from 'next/link';
import GroupsShell from '../groups/GroupsShell';

export const TABS = [
  { id: 'commons', label: 'The Commons', short: 'Commons', href: '/community' },
  { id: 'talk', label: 'Post-Game Talk', short: 'Talk', href: '/community/talk' },
  { id: 'ideas', label: 'Idea Board', short: 'Ideas', href: '/community/ideas' },
  { id: 'groups', label: 'Groups', short: 'Groups', href: '/community/groups' },
  { id: 'shop', label: 'Loft Shop', short: 'Shop', href: '/community/shop' },
  { id: 'peers', label: 'Puzzle Peers', short: 'Peers', href: '/community/peers' },
];

export default function CommunityShell({ tab, title, sub, aside = null, children }) {
  return (
    <GroupsShell eyebrow="Community">
      <style dangerouslySetInnerHTML={{ __html: COMMUNITY_CSS }} />
      <nav className="cm-tabs" aria-label="Community">
        {TABS.map((t) => (
          <Link key={t.id} href={t.href} className={t.id === tab ? 'on' : ''} aria-current={t.id === tab ? 'page' : undefined}>
            <span className="l">{t.label}</span><span className="s">{t.short}</span>
          </Link>
        ))}
      </nav>
      {title ? (
        <header className="cm-hero">
          <div>
            <h1>{title}</h1>
            {sub ? <p>{sub}</p> : null}
          </div>
          {aside}
        </header>
      ) : null}
      {children}
    </GroupsShell>
  );
}

// Pastel washes: the light register uses the site pastel, the dark one a 26%
// mix over transparent, so nothing glows on the dark stage.
export const COMMUNITY_CSS = `
.grp-main{max-width:1240px;}
.grp-cap{max-width:1240px;}
.cm-tabs{display:flex;border:1px solid var(--stg-ink);border-radius:12px;overflow:hidden;background:var(--stg-raise);margin-bottom:22px;}
.cm-tabs a{flex:1;display:flex;align-items:center;justify-content:center;min-height:46px;padding:0 8px;border-left:1px solid var(--stg-ink);
  color:var(--stg-ink);text-decoration:none;font-size:14px;font-weight:800;white-space:nowrap;line-height:1.25;}
.cm-tabs a:first-child{border-left:0;}
.cm-tabs a:hover{background:var(--stg-surf2);}
.cm-tabs a.on{background:var(--cm-indigo);}
.cm-tabs a .s{display:none;}
.cm-tabs a:focus-visible{outline:2px solid var(--stg-ink);outline-offset:-4px;}
.stage-page{--cm-sky:#bfe6fb;--cm-teal:#a6f4e7;--cm-green:#a2efc5;--cm-lime:#c4f09e;--cm-peach:#fdc394;--cm-rose:#fbaee7;--cm-violet:#d9c6f9;--cm-indigo:#c5cdfd;}
.stage-page:not([data-stage-theme=light]){--cm-sky:color-mix(in srgb,#bfe6fb 26%,transparent);--cm-teal:color-mix(in srgb,#a6f4e7 26%,transparent);
  --cm-green:color-mix(in srgb,#a2efc5 26%,transparent);--cm-lime:color-mix(in srgb,#c4f09e 26%,transparent);--cm-peach:color-mix(in srgb,#fdc394 26%,transparent);
  --cm-rose:color-mix(in srgb,#fbaee7 26%,transparent);--cm-violet:color-mix(in srgb,#d9c6f9 26%,transparent);--cm-indigo:color-mix(in srgb,#c5cdfd 30%,transparent);}
.cm-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:20px;}
.cm-hero h1{margin:0;font-size:clamp(28px,4vw,40px);font-weight:800;letter-spacing:-.02em;line-height:1.2;}
.cm-hero p{margin:6px 0 0;font-size:16px;font-weight:600;line-height:1.45;color:var(--stg-ink2);max-width:720px;}
.cm-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;}
.cm-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;}
.cm-g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;}
.cm-col{display:flex;flex-direction:column;gap:20px;min-width:0;}
.cm-g21{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:20px;}
.cm-g32{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:20px;}
.cm-first{order:0;}
.cm-card{background:var(--stg-raise);border:1px solid var(--stg-ink);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-width:0;}
.cm-ch{display:flex;justify-content:space-between;align-items:center;gap:4px 10px;flex-wrap:wrap;padding:13px 16px;border-bottom:1px solid var(--stg-ink);}
.cm-ch b{font-size:17px;font-weight:800;letter-spacing:-.01em;line-height:1.25;}
.cm-ch a,.cm-ch span{font-size:12.5px;font-weight:800;color:var(--stg-ink);text-decoration:none;white-space:nowrap;}
.cm-ch a:hover{text-decoration:underline;}
.cm-cb{padding:16px;display:flex;flex-direction:column;gap:12px;flex:1;}
.cm-rw{display:flex;align-items:center;gap:12px;padding:11px 16px;min-height:52px;font-size:14px;font-weight:700;color:var(--stg-ink);text-decoration:none;}
.cm-rw + .cm-rw{border-top:1px solid var(--stg-ink);}
a.cm-rw:hover{background:var(--stg-surf2);}
.cm-rw .gr{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}
.cm-rw .gr b{font-weight:800;line-height:1.3;}
.cm-rw .gr small{font-size:12.5px;font-weight:600;color:var(--stg-ink2);line-height:1.35;}
.cm-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border:1px solid var(--stg-ink);border-radius:999px;font-size:12px;font-weight:800;
  background:var(--stg-raise);color:var(--stg-ink);white-space:nowrap;line-height:1.35;}
.cm-chip.dk{background:var(--stg-ink);color:var(--stg-raise);}
.cm-glyph{flex:none;width:38px;height:38px;box-sizing:border-box;border-radius:10px;border:1px solid var(--stg-ink);display:grid;place-items:center;color:var(--stg-ink);}
.cm-gcat{background:color-mix(in srgb,var(--gh) 60%,#ffffff);color:#08222e;}
.stage-page:not([data-stage-theme=light]) .cm-gcat{background:color-mix(in srgb,var(--gh) 28%,transparent);color:var(--stg-ink);}
.cm-mut{color:var(--stg-ink2);font-weight:600;font-size:13.5px;line-height:1.45;margin:0;}
.cm-big{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.2;}
.cm-stats{display:flex;gap:14px;flex-wrap:wrap;}
.cm-stat{display:flex;flex-direction:column;padding:10px 16px;border:1px solid var(--stg-ink);border-radius:12px;background:var(--stg-raise);min-width:150px;}
.cm-stat b{font-size:22px;font-weight:800;line-height:1.25;font-variant-numeric:tabular-nums;}
.cm-stat span{font-size:12.5px;font-weight:700;color:var(--stg-ink2);}
.cm-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 18px;box-sizing:border-box;border:1px solid var(--stg-ink);
  border-radius:10px;background:var(--stg-raise);font:inherit;font-weight:800;font-size:14px;color:var(--stg-ink) !important;cursor:pointer;white-space:nowrap;text-decoration:none;line-height:1.25;}
.cm-btn:hover{background:var(--stg-surf2);}
.cm-btn.pri{background:var(--cm-indigo);}
.cm-btn.dk{background:var(--stg-ink);color:var(--stg-raise) !important;}
.cm-btn.full{width:100%;}
.cm-btn:disabled{opacity:.55;cursor:default;}
.cm-btn:focus-visible,.cm-seg button:focus-visible,.cm-in:focus-visible{outline:2px solid var(--stg-ink);outline-offset:2px;}
.cm-foot{margin-top:auto;padding:12px 16px;border-top:1px solid var(--stg-ink);display:flex;gap:10px;flex-wrap:wrap;}
.cm-seg{display:flex;border:1px solid var(--stg-ink);border-radius:10px;overflow:hidden;background:var(--stg-raise);}
.cm-seg button{flex:1;min-height:42px;border:0;border-radius:0;margin:0;border-left:1px solid var(--stg-ink);background:transparent;font:inherit;font-weight:800;font-size:13.5px;color:var(--stg-ink);
  cursor:pointer;padding:0 12px;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
.cm-seg button:first-child{border-left:0;}
.cm-seg button.on{background:var(--cm-indigo);}
.cm-seg button i{font-style:normal;font-weight:600;opacity:.75;}
.cm-in{font:inherit;font-size:14.5px;font-weight:600;border:1px solid var(--stg-ink);border-radius:10px;padding:10px 12px;background:var(--stg-raise);color:var(--stg-ink);min-width:0;width:100%;box-sizing:border-box;}
.cm-in::placeholder{color:var(--stg-mute);}
textarea.cm-in{resize:vertical;line-height:1.45;}
.cm-lab{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:800;}
.cm-err{margin:0;font-size:13px;font-weight:700;color:var(--stg-bad);}
.cm-ok{margin:0;font-size:13px;font-weight:700;color:var(--stg-good);}
.cm-eye{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--stg-ink2);}
.cm-empty{padding:18px 16px;}
@media (max-width:1000px){ .cm-g4{grid-template-columns:repeat(2,minmax(0,1fr));} .cm-g3{grid-template-columns:repeat(2,minmax(0,1fr));} }
@media (max-width:760px){
  .cm-g2,.cm-g3,.cm-g4,.cm-g21,.cm-g32{grid-template-columns:minmax(0,1fr);}
  .cm-first{order:-1;}
  /* THE PHONE TABS are two rows of three, every tab whole (no sideways scroll). */
  .cm-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));}
  .cm-tabs a{border-left:1px solid var(--stg-ink);border-top:1px solid var(--stg-ink);min-height:44px;padding:0 4px;}
  .cm-tabs a:nth-child(3n+1){border-left:0;}
  .cm-tabs a:nth-child(-n+3){border-top:0;}
  .cm-tabs a .l{display:none;} .cm-tabs a .s{display:inline;}
  .cm-rw{padding:10px 14px;gap:10px;}
  .cm-rw .gr small{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;}
  .cm-rw .cm-chip{font-size:11.5px;padding:3px 9px;}
  .cm-hero{align-items:flex-start;}
  .cm-stat{min-width:0;flex:1 1 40%;}
  /* No sideways scroll on a phone: a scrolled strip showed the box's rounded corner in the middle of the
     toggle (owner, 2026-11-18). The segments share the width and wrap their words instead. */
  .cm-seg{overflow:hidden;max-width:100%;}
  .cm-seg button{flex:1 1 0;min-width:0;white-space:normal;text-align:center;line-height:1.2;padding:5px 6px;font-size:12.5px;}
  .cm-hero h1{font-size:28px;}
  .cm-hero p{font-size:15px;}
}
`;
