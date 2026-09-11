'use client';

// THE FOOT OF A STAGE PAGE: the game's questions, its siblings, and the site
// footer with the daily roster in it.
//
// WHY (Search Console audit, 2026-09-01). When every daily moved onto the
// stage (2026-08-31) each client kept its <Footer /> but wrapped it in
// display:(focusMode || STAGE) ? 'none' : 'block', so on the stage, which is
// now every visitor, no game page had a visible footer at all: the page ended
// at "Report an issue". Google saw ten internal links on the whole site. This
// puts a footer back under every daily, the STAGE footer this time, which the
// stage home and the circuit pages already draw, and which now carries a link
// to every live daily (app/DailyRoster.jsx).
//
// AND THE QUESTIONS (Search Console, 2026-09-11). Ten days after the domain
// move, 136 game and quiz urls sat in "Duplicate without user-selected
// canonical" and several game pages had never been crawled at all. The About
// prose was there, the Game schema was there, but the plain answers a searcher
// types ("is it free", "when is the new one", "how do you play") were not, and
// each page linked ONE sibling. lib/game-seo.js derives a short Q&A and up to
// four same-category siblings from the registry; this prints them above the
// footer and emits the same Q&A as FAQPage schema. Every daily gets it by
// being in the registry; nothing per game to write.
//
// It is mounted from each game's page.js, AFTER the client, so it is in the
// server HTML on the first byte and needs nothing from the client's state. It
// sits outside the client's own .stage-page root, which is where the stage
// tokens (--stg-*) are scoped, so it carries a .stage-page root of its own,
// themed by the same hook the client uses; the server renders the same 'light'
// default the client hydrates against, exactly as the game root does.
//
// UX: nothing above the fold moves. The game root is min-height:100vh, so
// this lands below it, past "Report an issue", where the old footer used to
// be on the Loft page.

import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import { gameFaq, gameFaqJsonLd, relatedGames, gameCategory } from '@/lib/game-seo';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import StageFooter from './StageFooter';

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = 'Manrope, ui-sans-serif, system-ui, -apple-system, sans-serif';

export default function StageTail({ self, stage = true }) {
  const [theme] = useStageTheme();
  if (!stage) return null;
  const acc = {
    '--stg-acc-dk': gameColor(self),
    '--stg-acc-lt': gameColorLight(self),
    '--stg-onramp-lt': gameOnrampLight(self),
    '--stg-acc-ink-lt': gameAccentInkLight(self),
  };
  const game = DAILY_GAME_MAP[self];
  const faq = game ? gameFaq(self) : [];
  const jsonLd = game ? gameFaqJsonLd(self) : null;
  const rel = game ? relatedGames(self) : [];
  const cat = game ? gameCategory(self) : null;
  return (
    <div className="stage-page stage-tail" data-stage-theme={theme}
      style={{ ...acc, background: 'var(--stg-ground)', color: 'var(--stg-ink,#e9edf4)', position: 'relative', zIndex: 2 }}>
      {faq.length ? (
        <section className="stq" aria-labelledby="stq-h">
          {/* dangerouslySetInnerHTML, never a text child: React escapes an
              apostrophe on the server and <style> is a raw-text element, so the
              font stack would ship as &#x27;JetBrains Mono&#x27; and the rule
              would be dropped. See app/StageFooter.jsx. */}
          <style dangerouslySetInnerHTML={{ __html: CSS }} />
          {jsonLd ? (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          ) : null}
          <div className="stq-in">
            <h2 id="stq-h">{game.name}, in short</h2>
            {faq.map(([q, a, html], i) => (
              <details key={q} open={i === 0}>
                <summary>{q}</summary>
                {html ? <p dangerouslySetInnerHTML={{ __html: html }} /> : <p>{a}</p>}
              </details>
            ))}
            {rel.length ? (
              <nav className="stq-more" aria-label={cat ? `More daily ${cat.label.toLowerCase()}` : 'More daily puzzles'}>
                <span>{cat ? `More daily ${cat.label.toLowerCase()}:` : 'More daily puzzles:'}</span>
                {rel.map((r) => <a key={r.key} href={r.href} title={r.tag}>{r.name}</a>)}
                {cat ? <a href={cat.href} className="stq-all">All {cat.label.toLowerCase()}</a> : null}
              </nav>
            ) : null}
          </div>
        </section>
      ) : null}
      <StageFooter />
    </div>
  );
}

// NOTE: this block is a JS template literal, so no backticks in the comments.
// Same measures and weights as the category landing page's Questions block
// (app/puzzle-category/CategoryLanding.jsx), so a reader who arrives from one
// meets the same object on the other.
const CSS = `
.stq{padding:30px 22px 34px;font-family:${SANS};}
.stq *{box-sizing:border-box;}
.stq-in{max-width:640px;margin:0 auto;}
.stq h2{margin:0;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--stg-ink);}
.stq details{border-top:1px solid var(--stg-line);padding:11px 0;}
.stq details:first-of-type{margin-top:8px;}
.stq summary{font-weight:800;font-size:14.5px;cursor:pointer;list-style:none;color:var(--stg-ink);}
.stq summary::-webkit-details-marker{display:none;}
.stq summary:focus-visible{outline:2px solid var(--stg-acc);outline-offset:3px;border-radius:4px;}
.stq p{margin:8px 0 0;max-width:66ch;font-size:14.5px;line-height:1.62;color:var(--stg-ink2);font-weight:500;}
.stq p a{color:var(--stg-ink);font-weight:700;text-decoration:underline;text-underline-offset:2px;}
.stq p a:hover{color:var(--stg-acc-ink);}
.stq-more{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;font-weight:600;color:var(--stg-mute);padding-top:18px;border-top:1px solid var(--stg-line);}
.stq-more a{color:var(--stg-ink);font-weight:700;text-decoration:none;}
.stq-more a:hover{color:var(--stg-acc-ink);}
.stq-more a:focus-visible{outline:2px solid var(--stg-acc);outline-offset:3px;border-radius:4px;}
.stq-more .stq-all{margin-left:auto;font-family:${MONO};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute);}
.stq-more .stq-all:hover{color:var(--stg-ink);}
`;
