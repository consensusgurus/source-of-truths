'use client';

// Source of Truths masthead, used only by the Sports Ranking pages.
//
// These pages are a Source of Truths property rather than a Mind Loft one
// (owner rule, 2026-08-28, reaffirmed 2026-09-04), so they lead with that
// wordmark instead of the site-wide SiteHeader. The Mind Loft footer still runs
// at the bottom: it carries the legal links and is the site's real internal-link
// registry, and a sub-brand sitting inside a parent site is the normal shape for
// that.
//
// IT IS BUILT OUT OF THE STAGE CAP'S OWN PARTS (2026-09-04), not out of a
// palette of its own: the ground, the mono eyebrow at 9px / .15em, the nav as
// `.stg-cx` pills, and the active tab as an --stg-acc fill carrying
// --stg-onramp, which is exactly what the cap's own Rankings chip does. So the
// sub-brand survives and the page still reads as part of the site.
//
// It became a CLIENT component in the same pass, for one reason: these pages
// have no site header to hang a register switch from, so the switch has to live
// here. Nothing else about it needs the client, and the ranking itself is
// untouched by this: GridironTable is still a server component rendered as a
// child of RankingsStage, so the board is still in the server HTML.
import Link from 'next/link';
import { useStageTheme, useThemeHint } from '@/lib/stage-theme';

export default function SotHeader({ active }) {
  const [theme, setTheme] = useStageTheme();
  const hint = useThemeHint();
  return (
    <header className="soth">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="soth-in">
        <Link href="/collegefootballrankings" className="soth-brand">
          <span className="soth-wm">Source of <b>Truths</b></span>
          <span className="soth-tag">Sports Rankings</span>
        </Link>
        <nav className="soth-nav">
          <Link href="/collegefootballrankings" className={'stg-cx' + (active === 'cfb' ? ' on' : '')}>
            College Football
          </Link>
          <Link href="/nflrankings" className={'stg-cx' + (active === 'nfl' ? ' on' : '')}>
            NFL
          </Link>
          <Link href="/mlbrankings" className={'stg-cx' + (active === 'mlb' ? ' on' : '')}>
            MLB
          </Link>
        </nav>
        <button
          type="button"
          className={'stg-cx soth-th' + (hint ? ' hint' : '')}
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
          title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
        >
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
            </svg>
          )}
        </button>
        <Link href="/" className="soth-back">Mind&nbsp;Loft&nbsp;&rsaquo;</Link>
      </div>
    </header>
  );
}

// No backtick anywhere in this string, comments included.
const SANS = "'Manrope',system-ui,-apple-system,sans-serif";
const MONO = "'Manrope',ui-monospace,SFMono-Regular,Menlo,monospace";

const CSS = `
.soth{background:var(--stg-ground,#0b0f1a);color:var(--stg-ink,#e9edf4);font-family:${SANS};
  border-bottom:1px solid var(--stg-line);}
.soth-in{max-width:1440px;margin:0 auto;padding:12px 20px;
  display:flex;align-items:center;gap:16px;flex-wrap:wrap;}
/* The wordmark is a LINK, not a chip, and the rule to its right is what
   separates the sub-brand from the boards. Same shape as the stage cap. */
.soth-brand{display:flex;flex-direction:column;gap:2px;text-decoration:none;
  color:var(--stg-ink);flex:none;padding-right:15px;border-right:1px solid var(--stg-line);}
.soth-wm{font-size:13.5px;font-weight:800;letter-spacing:-.01em;line-height:1.15;white-space:nowrap;}
.soth-wm b{color:var(--stg-acc-ink);font-weight:800;}
.soth-tag{font-family:${MONO};font-size:9px;letter-spacing:.15em;text-transform:uppercase;
  color:var(--stg-mute2);}
.soth-nav{display:flex;gap:7px;flex-wrap:wrap;margin-right:auto;}
.soth .stg-cx{display:inline-flex;align-items:center;gap:6px;font-family:${MONO};font-size:10px;
  letter-spacing:.11em;text-transform:uppercase;color:var(--stg-ink2);
  border:1px solid var(--stg-line);border-radius:99px;padding:5px 11px;background:none;
  cursor:pointer;text-decoration:none;white-space:nowrap;}
.soth .stg-cx:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.soth .stg-cx:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.soth-nav .stg-cx.on{color:var(--stg-onramp);background:var(--stg-acc);border-color:var(--stg-acc);}
.soth-th{padding:5px 8px;}
/* The first-visit pointer at the switch, the same three pulses the stage cap
   draws. It is the only control on these pages a reader has not seen before. */
.soth-th.hint{border-color:var(--stg-acc);color:var(--stg-acc-ink);animation:soth-ring 1.9s ease-out 3;}
@keyframes soth-ring{
  0%{box-shadow:0 0 0 0 var(--stg-acc);}
  70%{box-shadow:0 0 0 10px transparent;}
  100%{box-shadow:0 0 0 0 transparent;}
}
@media (prefers-reduced-motion: reduce){ .soth-th.hint{animation:none;} }
.soth-back{font-family:${MONO};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--stg-mute2);text-decoration:none;white-space:nowrap;}
.soth-back:hover{color:var(--stg-ink);}
@media(max-width:560px){
  .soth-in{padding:10px 13px;gap:10px;}
  .soth-brand{padding-right:11px;}
  .soth-wm{font-size:12.5px;}
  .soth-nav{gap:6px;}
}
`;
