import CircuitFrame from '../circuits/CircuitFrame';
import { IQ_TESTS, MIN_ITEMS, MAX_ITEMS } from '@/lib/iq-tests';
import { iqItemsFor } from '@/lib/iq-pool';
import { IQ_SNAPSHOT } from '@/lib/iq-items';
import { SITE_URL } from '@/lib/site';
import IqBest from '../iq/IqBest';
import { EXAMS, EXAM_ORDER } from '../exams/examData';
import PageViewBeacon from '../PageViewBeacon';
import { IQ_RAMP_CSS } from '@/lib/iq-style';

// /tests: THE TESTS PAGE (owner, 2026-11-21: "On homepage we can combine tests
// to one button - need to rework school test and iq tests to be on same page").
// The trivia IQ tests (was /iq) and the school practice tests (was /exams, the
// "Where Will You Get In?" hub, with the LSAT logic games) on one page; both old
// addresses 308 here (next.config.js). Server rendered, so the whole list is in
// the HTML for search; each reader's own IQ best is IqBest, from this device.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Free IQ Tests and School Practice Tests: Trivia IQ, LSAT, SAT, GMAT | Mind Loft',
  description:
    'Free adaptive trivia IQ tests in nine categories, plus hard practice tests in the style of the LSAT, GMAT, SAT, ACT, GRE, and MCAT matched to a shortlist of schools.',
  alternates: { canonical: '/tests' },
  openGraph: {
    title: 'Mind Loft Tests: Trivia IQ and School Practice Tests',
    description: 'Nine adaptive trivia IQ tests and six school practice tests. How do you rank?',
    url: '/tests', type: 'website', siteName: 'Mind Loft',
    images: [{ url: '/og/brand.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', images: ['/og/brand.png'] },
};

// The LSAT's classic analytical-reasoning puzzles (lib/quizzes.js, format
// 'logic-game', playing at /quiz/<id>), carried over from the old /exams hub.
const LOGIC_GAMES = [
  { id: 'lsat-logic-game-gallery-wall', name: 'The Gallery Wall' },
  { id: 'lsat-logic-game-service-bay', name: 'The Service Bay' },
  { id: 'lsat-logic-game-recital-order', name: 'The Recital Order' },
  { id: 'lsat-logic-game-debate-lineup', name: 'The Debate Lineup' },
  { id: 'lsat-logic-game-tasting-flight', name: 'The Tasting Flight' },
  { id: 'lsat-logic-game-closing-shift', name: 'The Closing Shift' },
  { id: 'lsat-logic-game-festival-headliners', name: 'The Festival Headliners' },
  { id: 'lsat-logic-game-garden-bed', name: 'The Garden Bed' },
  { id: 'lsat-logic-game-expert-panel', name: 'The Expert Panel' },
  { id: 'lsat-logic-game-festival-lineup', name: 'A Festival Lineup' },
];

export default function TestsPage() {
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
    name: 'Mind Loft Tests',
    url: `${SITE_URL}/tests`,
    numberOfItems: rows.length + EXAM_ORDER.length,
    itemListElement: [
      ...rows.map((r) => ({ name: `${r.name} IQ Test`, url: `${SITE_URL}/iq/${r.slug}` })),
      ...EXAM_ORDER.map((k) => ({ name: `${EXAMS[k].label} Practice Test`, url: `${SITE_URL}/${k}` })),
    ].map((x, i) => ({ '@type': 'ListItem', position: i + 1, ...x })),
  };
  const asOf = (() => {
    try { return new Date(`${IQ_SNAPSHOT}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
    catch (e) { return IQ_SNAPSHOT; }
  })();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageViewBeacon id="tests" />
      <CircuitFrame label="Tests">
        <div className="iqh">
          <style dangerouslySetInnerHTML={{ __html: IQ_RAMP_CSS + CSS }} />
          <section className="iqh-hero">
            <div className="iqh-eb">IQ Tests and School Tests</div>
            <h1 className="iqh-h1">Tests</h1>
            <nav className="iqh-jump" aria-label="On this page"><a href="#iq-tests">IQ Tests</a><a href="#school-tests">School Tests</a></nav>
            <p className="iqh-sub">Two kinds of test, all free: an adaptive trivia IQ test for each category, scored against real Mind Loft players, and hard practice tests in the style of six admissions exams, matched to a shortlist of schools.</p>
          </section>

          <section id="iq-tests">
            <div className="iqh-head"><h2>Trivia IQ Tests</h2></div>
            <p className="iqh-lede">
              One adaptive test for each trivia category. Every question has already run on a Mind Loft daily
              gauntlet, and its difficulty comes from how real players did on it, so the test can say where you stand
              rather than just how many you got. {MIN_ITEMS} to {MAX_ITEMS} questions, about eight minutes, harder when
              you are right and easier when you are not.
            </p>
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

          <section id="school-tests">
            <div className="iqh-head"><h2>School Tests: Where Will You Get In?</h2></div>
            <p className="iqh-lede">Ten hard questions in the style of each admissions test, 75 seconds each. Your score is matched to a shortlist of schools. Questions are original; for fun only, not admissions advice.</p>
            <div className="iqh-cards">
              {EXAM_ORDER.map((k, i) => (
                <a key={k} className="iqh-c" href={`/${k}`} style={{ '--cc': `var(--iq-r${i})` }}>
                  <span className="iqh-nm">{EXAMS[k].label}</span>
                  <span className="iqh-bl">{EXAMS[k].tagline}</span>
                  <span className="iqh-ft"><span className="iqh-ct">10 questions · ranked {EXAMS[k].payoffNoun}</span></span>
                </a>
              ))}
            </div>
            <div className="iqh-head iqh-sub2"><h2>LSAT Logic Games</h2></div>
            <div className="iqh-cards">
              {LOGIC_GAMES.map((g, i) => (
                <a key={g.id} className="iqh-c" href={`/quiz/${g.id}`} style={{ '--cc': `var(--iq-r${(i + 6) % 10})` }}>
                  <span className="iqh-nm">{g.name}</span>
                  <span className="iqh-bl">An LSAT analytical reasoning puzzle: read the setup and rules, then answer.</span>
                </a>
              ))}
            </div>
          </section>

          <section className="iqh-how">
            <h2>How the IQ score works</h2>
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
.iqh-hero::before{content:'';position:absolute;left:0;top:3px;bottom:3px;width:4px;border-radius:2px;background:var(--stg-acc-ink,var(--stg-acc));}
.iqh-eb{font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:var(--stg-mute);}
.iqh-h1{margin:7px 0 0;font-size:36px;font-weight:800;letter-spacing:-0.025em;line-height:1.06;color:var(--stg-ink);}
.iqh-sub{margin:10px 0 0;font-size:15px;font-weight:600;line-height:1.55;max-width:64ch;color:var(--stg-ink2);}
.iqh-head h2,.iqh-how h2{margin:0 0 11px;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--stg-ink);}
.iqh-cards{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;}
.iqh-cards>.iqh-c{flex:0 0 calc((100% - 16px) / 3);box-sizing:border-box;}
@media (max-width:980px){.iqh-cards>.iqh-c{flex-basis:calc((100% - 8px) / 2);}}
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
.iqh-jump{display:flex;gap:10px;margin-top:12px;}
.iqh-jump a{font-size:13px;font-weight:800;padding:7px 13px;border-radius:999px;border:1px solid var(--stg-line);color:var(--stg-ink);text-decoration:none;}
.iqh-jump a:hover{border-color:var(--stg-ink);}
.iqh-lede{margin:-4px 0 12px;font-size:14px;font-weight:600;line-height:1.55;color:var(--stg-ink2);max-width:74ch;}
.iqh-sub2{margin-top:22px;}
.iqh-how p{margin:0 0 10px;font-size:14px;font-weight:600;line-height:1.65;color:var(--stg-ink2);max-width:74ch;}
@media (max-width:640px){.iqh-h1{font-size:28px;}.iqh-cards>.iqh-c{flex-basis:100%;}}
`;
