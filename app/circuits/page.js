import CircuitFrame from './CircuitFrame';
import { ALL_CIRCUITS, DISPLAY_CIRCUITS, circuitGamesFor, circuitPageHref, isMarquee, isSoloCircuit } from '@/lib/circuits';
import { categoryColor, categoryColorLight } from '@/lib/category-ramp';
import { SITE_URL } from '@/lib/site';

// /circuits — the index of all fifteen.
//
// Two jobs. It is the crawlable link path to every /circuits/<id> page (and
// through them to every daily), and it is where a circuit page sends a reader
// who wants the others. The home console band can only show one circuit at a
// time, so until this page there was no single surface listing the family.
//
// Fully server-rendered apart from the frame: nothing in the LIST depends on
// who is looking, and the per-circuit pages carry the viewer's own state.
// CircuitFrame is a client component only because the register switch is, and
// it takes these rows as children, so the roster is still in the HTML.
//
// A STAGE PAGE, like /circuits/<id> and like every daily. See CircuitFrame.

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Circuits: Daily Puzzle Runs by Skill | Mind Loft',
  description:
    'Fifteen circuits, each a run of daily puzzles played as one sitting and ranked on your combined placement across all of them. Crosswords, sudoku, deduction, mental math and more, free and with no account needed.',
  alternates: { canonical: '/circuits' },
  openGraph: {
    title: 'Mind Loft Circuits',
    description: 'Five daily puzzles, one run, one combined leaderboard. Pick the skill you want to work.',
    url: '/circuits',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function CircuitsIndexPage() {
  const day = etTodayServer();
  // Browse order, the same one the home page's shelf uses.
  const rows = DISPLAY_CIRCUITS.map((c) => {
    const games = circuitGamesFor(c.id, day);
    return {
      id: c.id,
      name: c.name,
      marquee: !!isMarquee(c.id),
      invite: c.share.invite,
      tier: (c.trophy && c.trophy.tier) || null,
      names: games.map((g) => g.name),
      // A circuit wears its LEAD GAME'S category step rather than a colour of
      // its own, exactly as the shelf on the home does. Both registers travel
      // with the row and the stylesheet picks one, because this list is server
      // rendered and a hue chosen in JS would repaint under the reader.
      hue: games[0] ? categoryColor(games[0].cat) : null,
      hueLight: games[0] ? categoryColorLight(games[0].cat) : null,
    };
  }).filter((r) => r.names.length >= 2 || (r.names.length === 1 && isSoloCircuit(r.id)));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Mind Loft Circuits',
    url: `${SITE_URL}/circuits`,
    numberOfItems: rows.length,
    itemListElement: rows.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: r.marquee ? r.name : `The ${r.name} Circuit`,
      url: `${SITE_URL}${circuitPageHref(r.id)}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* NO `cat`: this page belongs to all fifteen circuits and therefore to
          all nine categories, so it keeps the stage's default accent rather
          than borrowing one circuit's step. */}
      <CircuitFrame label="Circuits">
        <div className="cix">
          {/* dangerouslySetInnerHTML, never a text child. This page is SERVER
              rendered, so nothing re-renders it on the client and there is no
              second chance: React escapes every apostrophe, <style> is a
              raw-text element, and content:'' plus the
              [data-stage-theme='light'] rules ship as entities and are dropped.
              See the note in app/circuits/CircuitFrame.jsx. */}
          <style dangerouslySetInnerHTML={{ __html: CSS }} />

          <section className="cix-hero">
            <div className="cix-eb">Circuits</div>
            <h1 className="cix-h1">One run, one combined board</h1>
            <p className="cix-sub">
              A circuit is a handful of daily puzzles played as one sitting and ranked on your combined
              placement across all of them, shortest game first. The Daily Five changes every day. The rest
              are fixed, so you can pick the skill you want to work and come back to it tomorrow.
            </p>
          </section>

          <section>
            <div className="cix-head">
              <h2>All {rows.length} circuits</h2>
            </div>
            <div className="cix-cards">
              {rows.map((r) => (
                <a
                  key={r.id}
                  className="cix-c"
                  href={circuitPageHref(r.id)}
                  style={{ '--cc-dk': r.hue || undefined, '--cc-lt': r.hueLight || undefined }}
                >
                  <span className="cix-top">
                    <span className="cix-nm">{r.marquee ? r.name : `The ${r.name} Circuit`}</span>
                    {r.tier ? <span className={`cix-tier ${r.tier}`}>{r.tier}</span> : null}
                  </span>
                  <span className="cix-iv">{r.invite}</span>
                  <span className="cix-gm">
                    {r.names.length} games &middot; {r.names.join(', ')}
                  </span>
                </a>
              ))}
            </div>
            <p className="cix-note">
              Every game is free and needs no account. A game played on its own still counts toward its
              circuit, but all of them have to land on the same day to take a rank on that circuit&rsquo;s board.
            </p>
          </section>
        </div>
      </CircuitFrame>
    </>
  );
}

// NOTE: this block is a JS template literal, so no backticks in the comments.
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const CSS = `
.cix{display:flex;flex-direction:column;gap:30px;}

.cix-hero{position:relative;padding-left:16px;}
.cix-hero::before{content:'';position:absolute;left:0;top:3px;bottom:3px;width:4px;
  border-radius:2px;background:var(--stg-acc);}
.cix-eb{font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;
  color:var(--stg-mute);}
.cix-h1{margin:7px 0 0;font-size:36px;font-weight:800;letter-spacing:-0.025em;line-height:1.06;
  color:var(--stg-ink);}
.cix-sub{margin:10px 0 0;font-size:15px;font-weight:600;line-height:1.55;max-width:64ch;
  color:var(--stg-ink2);}

.cix-head{display:flex;align-items:baseline;gap:11px;margin-bottom:11px;}
.cix-head h2{margin:0;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;
  color:var(--stg-ink);}

/* Two across where there is room. These cards carry a full sentence each, so a
   three-across shelf would set them at a measure nobody wants to read. */
.cix-cards{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));}
.cix-c{--cc:var(--cc-dk,var(--stg-ink2));position:relative;display:block;min-width:0;
  text-decoration:none;color:var(--stg-ink);background:var(--stg-surf);
  border:1px solid var(--stg-line);border-radius:10px;padding:13px 15px 14px 18px;
  overflow:hidden;}
[data-stage-theme='light'] .cix-c{--cc:var(--cc-lt,var(--stg-ink2));}
.cix-c::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--cc);}
.cix-c:hover{border-color:var(--cc);}
.cix-c:focus-visible{outline:2px solid var(--cc);outline-offset:2px;}
.cix-top{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;}
.cix-nm{font-size:16px;font-weight:800;letter-spacing:-0.015em;min-width:0;}
.cix-tier{margin-left:auto;flex:none;font-family:${MONO};font-size:9px;font-weight:700;
  letter-spacing:.12em;text-transform:uppercase;padding:4px 8px;border-radius:999px;
  background:var(--stg-chip);color:var(--stg-ink2);}
.cix-tier.gold{background:rgba(251,191,36,0.16);color:#fbbf24;}
.cix-tier.silver{background:rgba(203,213,225,0.16);color:#cbd5e1;}
.cix-tier.bronze{background:rgba(217,142,86,0.18);color:#e0a273;}
[data-stage-theme='light'] .cix-tier.gold{background:#fdf3d8;color:#7a5c0c;}
[data-stage-theme='light'] .cix-tier.silver{background:#eaedf2;color:#4b5361;}
[data-stage-theme='light'] .cix-tier.bronze{background:#f6e9dd;color:#7d4f26;}
.cix-iv{display:block;font-size:12.5px;font-weight:600;color:var(--stg-ink2);margin-top:5px;
  line-height:1.5;}
.cix-gm{display:block;font-family:${MONO};font-size:10.5px;font-weight:600;color:var(--stg-mute);
  margin-top:8px;line-height:1.5;}
.cix-note{font-size:12.5px;font-weight:600;color:var(--stg-mute);line-height:1.6;margin:14px 0 0;
  max-width:74ch;}

@media (max-width:640px){
  .cix{gap:24px;}
  .cix-h1{font-size:27px;}
  .cix-sub{font-size:14px;}
  .cix-cards{grid-template-columns:minmax(0,1fr);}
}
`;
