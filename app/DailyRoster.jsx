// EVERY DAILY PUZZLE, AS A PLAIN LINK, IN THE SERVER HTML (Search Console
// audit, 2026-09-01).
//
// WHY THIS FILE EXISTS
// ──────────────────────────────────────────────────────────────────────────
// Google's Links report for mindloftdaily.com showed TEN internal links for
// the whole site, and 2,076 URLs parked under "Discovered - currently not
// indexed", among them cages, towers, polka, feud, four, jesters and a dozen
// more dailies. Measured on the live HTML: the homepage's server markup held
// 15 anchors and not one of them pointed at a game (the tiles render on the
// client, and link to /crux?stage=1, a query variant); a game page's server
// markup linked exactly ONE other game; and on the stage the whole footer sat
// under display:none. So the only path Google had to most of the roster was
// the sitemap, and a sitemap URL with no inbound link is precisely what that
// status means.
//
// This is the fix: one small nav that names every live daily by its clean
// route, grouped by category, rendered by BOTH footers (app/Footer.jsx on the
// light pages, app/StageFooter.jsx on the stage) so it lands on every page of
// the site in the first HTML byte.
//
// TWO RULES
// ──────────────────────────────────────────────────────────────────────────
// 1. CLEAN HREFS ONLY. `/cages`, never `/cages?stage=1` or `?five=1`. The
//    canonical is the bare route, and a link to a variant is a link Google has
//    to reconcile before it counts.
// 2. NO HOOKS, NO STATE, NO HIDING. It is a plain function of the registry so
//    it renders identically on the server and the client, and it is visible
//    at full contrast (see the cloaking note in app/SeoSection.jsx).
//
// The roster comes off lib/daily-games.js, so a new game appears here the
// day its registry row lands, and a retired one drops out on its date.

import { DAILY_GAMES, liveDailyKeys } from '@/lib/daily-games';
import { categoryHref } from '@/lib/puzzle-categories';

// Category order matches the home's shelf order (CAT_ORDER in
// app/today/TodayClient.jsx); anything not named there trails, in roster order.
const CAT_ORDER = ['Word', 'Numbers', 'Sudoku', 'Logic', 'Trivia', 'Geography', 'End Game', 'Cards', 'Arcade', 'Crowd Psychology'];

export function dailyRosterGroups() {
  const live = new Set(liveDailyKeys());
  const by = new Map();
  for (const g of DAILY_GAMES) {
    if (!live.has(g.key)) continue;
    if (!by.has(g.cat)) by.set(g.cat, []);
    by.get(g.cat).push({ href: g.href, name: g.name });
  }
  const cats = [...by.keys()].sort((a, b) => {
    const ia = CAT_ORDER.indexOf(a); const ib = CAT_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  // A category with a landing page (lib/puzzle-categories.js) links its label
  // there; that link and the one in the game cap are what keep those pages
  // from being orphans.
  return cats.map((cat) => ({ cat, href: categoryHref(cat), games: by.get(cat) }));
}

// variant: 'stage' paints with the stage tokens (--stg-*), 'light' with the
// shared footer's neutral greys. The markup is identical either way.
export default function DailyRoster({ variant = 'light' }) {
  const groups = dailyRosterGroups();
  const total = groups.reduce((n, g) => n + g.games.length, 0);
  return (
    <nav className={`dr dr-${variant}`} aria-label="All daily puzzles">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="dr-head">
        <b>All {total} daily puzzles</b>
        <a href="/archive">Puzzle archive</a>
        <a href="/circuits">Circuits</a>
      </div>
      {groups.map((g) => (
        <div key={g.cat} className="dr-row">
          {g.href ? <a className="dr-cat" href={g.href}>{g.cat}</a> : <span className="dr-cat">{g.cat}</span>}
          <span className="dr-links">
            {g.games.map((x) => <a key={x.href} href={x.href}>{x.name}</a>)}
          </span>
        </div>
      ))}
    </nav>
  );
}

// No apostrophes and no backticks in this block: it is a template literal
// handed to dangerouslySetInnerHTML.
const CSS = `
.dr{margin:22px 0 0;padding-top:16px;border-top:1px solid var(--dr-line);font-size:12px;line-height:1.7;}
.dr *{box-sizing:border-box;}
.dr-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px;margin-bottom:6px;}
.dr-head b{font-size:12.5px;font-weight:800;color:var(--dr-ink);}
.dr-head a{font-size:12px;font-weight:700;color:var(--dr-mute);text-decoration:none;}
.dr-row{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 10px;}
.dr-cat{flex:0 0 140px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dr-soft);text-decoration:none;}
a.dr-cat:hover{color:var(--dr-ink);}
.dr-links{flex:1 1 300px;min-width:0;display:flex;flex-wrap:wrap;gap:0 12px;}
.dr-links a{color:var(--dr-mute);text-decoration:none;font-weight:600;white-space:nowrap;}
.dr-links a:hover,.dr-head a:hover{color:var(--dr-ink);}
.dr-links a:focus-visible,.dr-head a:focus-visible{outline:2px solid var(--dr-acc);outline-offset:2px;border-radius:3px;}
.dr-light{--dr-ink:#14161c;--dr-mute:#55606f;--dr-soft:#7a8494;--dr-line:rgba(20,22,28,0.12);--dr-acc:#2f6fe4;}
.dr-stage{--dr-ink:var(--stg-ink,#e9edf4);--dr-mute:var(--stg-mute,#8b95a8);--dr-soft:var(--stg-mute2,#66748f);--dr-line:var(--stg-line,rgba(255,255,255,0.11));--dr-acc:var(--stg-acc,#2f6fe4);}
@media (max-width:640px){.dr-cat{flex-basis:100%;}}
`;
