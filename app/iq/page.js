import CircuitFrame from '../circuits/CircuitFrame';
import { IQ_TESTS, MIN_ITEMS, MAX_ITEMS } from '@/lib/iq-tests';
import { iqItemsFor } from '@/lib/iq-pool';
import { IQ_SNAPSHOT } from '@/lib/iq-items';
import { SITE_URL } from '@/lib/site';
import IqBest from './IqBest';
import PageViewBeacon from '../PageViewBeacon';
import { IQ_RAMP_CSS } from '@/lib/iq-style';

// /iq, the home of the trivia IQ tests. Server rendered, so the whole list is
// in the HTML for search and for a reader on a slow connection; the one thing
// that depends on who is looking, each reader's own best, is IqBest, which
// reads this device only.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Trivia IQ Tests: Free Adaptive Tests by Category | Mind Loft',
  description:
    'Nine free adaptive trivia tests, one per category: general knowledge, geography, history, science, movies and TV, music, words and books, sports and business. Each is calibrated on real Mind Loft players and scored as a player-normed IQ with a percentile.',
  alternates: { canonical: '/iq' },
  openGraph: {
    title: 'Mind Loft Trivia IQ Tests',
    description: 'Nine adaptive trivia tests calibrated on real players. How do you rank?',
    url: '/iq', type: 'website', siteName: 'Mind Loft',
    images: [{ url: '/og/brand.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', images: ['/og/brand.png'] },
};

export default function IqHome() {
  const ids = new Set();
  const rows = IQ_TESTS.map((t) => {
    const items = iqItemsFor(t.slug);
    for (const it of items) ids.add(it.id);
    return { ...t, count: items.length };
  });
  // General Knowledge overlaps every other test, so the site-wide figure is
  // the distinct questions, not the sum of the nine banks.
  const total = ids.size;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Mind Loft Trivia IQ Tests',
    url: `${SITE_URL}/iq`,
    numberOfItems: rows.length,
    itemListElement: rows.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: `${r.name} IQ Test`, url: `${SITE_URL}/iq/${r.slug}` })),
  };
  const asOf = (() => {
    try { return new Date(`${IQ_SNAPSHOT}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
    catch (e) { return IQ_SNAPSHOT; }
  })();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageViewBeacon id="iq" />
      <CircuitFrame label="IQ Tests">
        <div className="iqh">
          <style dangerouslySetInnerHTML={{ __html: IQ_RAMP_CSS + CSS }} />
          <section className="iqh-hero">
            <div className="iqh-eb">Trivia IQ Tests</div>
            <h1 className="iqh-h1">How much do you really know?</h1>
            <p className="iqh-sub">
              One adaptive test for each trivia category. Every question has already run on a Mind Loft daily
              gauntlet, and its difficulty comes from how real players did on it, so the test can say where you stand
              rather than just how many you got. {MIN_ITEMS} to {MAX_ITEMS} questions, about eight minutes, harder when
              you are right and easier when you are not.
            </p>
          </section>

          <section>
            <div className="iqh-head"><h2>Pick a category</h2></div>
            <div className="iqh-cards">
              {rows.map((r) => (
                <a key={r.slug} className="iqh-c" href={`/iq/${r.slug}`} style={{ '--cc': `var(--iq-r${r.ramp})` }}>
                  <span className="iqh-nm">{r.name}</span>
                  <span className="iqh-bl">{r.blurb}</span>
                  <span className="iqh-ft">
                    <span className="iqh-ct">{r.count.toLocaleString()} calibrated questions</span>
                    <IqBest slug={r.slug} />
                  </span>
                </a>
              ))}
            </div>
          </section>

          <section className="iqh-how">
            <h2>How the score works</h2>
            <p>
              The daily gauntlets (Streak, Deep, Atlas, Sport and Biz) are one life and asked in a fixed order, so a
              day&rsquo;s results show exactly who reached each question and who got past it. From that, every one of
              the {total.toLocaleString()} questions here carries a measured difficulty, last calibrated on {asOf}.
              Questions from days that have not run yet are never used, so a test can never spoil a daily.
            </p>
            <p>
              Your score is IQ shaped but player normed: 100 is the typical Mind Loft player and 15 points is one
              standard deviation of that field, with a plus or minus that shrinks as you answer. It measures what you
              know about a subject against the people who play here. Nothing is posted to any leaderboard; your results stay on this device.
            </p>
          </section>
        </div>
      </CircuitFrame>
    </>
  );
}

const MONO = "'Manrope', ui-monospace, SFMono-Regular, Menlo, monospace";

const CSS = `
.iqh{display:flex;flex-direction:column;gap:30px;}
.iqh-hero{position:relative;padding-left:16px;}
.iqh-hero::before{content:'';position:absolute;left:0;top:3px;bottom:3px;width:4px;border-radius:2px;background:var(--stg-acc);}
.iqh-eb{font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:var(--stg-mute);}
.iqh-h1{margin:7px 0 0;font-size:36px;font-weight:800;letter-spacing:-0.025em;line-height:1.06;color:var(--stg-ink);}
.iqh-sub{margin:10px 0 0;font-size:15px;font-weight:600;line-height:1.55;max-width:64ch;color:var(--stg-ink2);}
.iqh-head h2,.iqh-how h2{margin:0 0 11px;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--stg-ink);}
.iqh-cards{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));}
.iqh-c{position:relative;display:flex;flex-direction:column;min-width:0;text-decoration:none;color:var(--stg-ink);
  background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:10px;padding:14px 15px 13px 19px;overflow:hidden;}
.iqh-c::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--cc);}
.iqh-c:hover{border-color:var(--cc);}
.iqh-c:focus-visible{outline:2px solid var(--cc);outline-offset:2px;}
.iqh-nm{font-size:17px;font-weight:800;letter-spacing:-0.015em;}
.iqh-bl{margin-top:5px;font-size:12.5px;font-weight:600;line-height:1.5;color:var(--stg-ink2);flex:1;}
.iqh-ft{display:flex;align-items:baseline;gap:8px;margin-top:10px;flex-wrap:wrap;}
.iqh-ct{font-family:${MONO};font-size:10.5px;font-weight:600;color:var(--stg-mute);}
.iqh-best{margin-left:auto;font-family:${MONO};font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  padding:4px 8px;border-radius:999px;background:var(--stg-chip);color:var(--stg-ink);}
.iqh-how p{margin:0 0 10px;font-size:14px;font-weight:600;line-height:1.65;color:var(--stg-ink2);max-width:74ch;}
@media (max-width:640px){.iqh-h1{font-size:28px;}.iqh-cards{grid-template-columns:minmax(0,1fr);}}
`;
