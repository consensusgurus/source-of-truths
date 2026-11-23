'use client';

// THE BODY OF /which-is-closer. A client component for the same reason
// CategoryLanding is one: CircuitFrame's stylesheet is repaired on the client
// only when a client parent renders it. Every word (the H1, the rows, the
// blurbs, the FAQ) arrives as props from the server page, so the whole page is
// in the server HTML for a crawler.
//
// One row per quiz, grouped United States / Sports / World, in the stage
// registers. No boards here: these are catalog quizzes, each with its own
// leaderboard on its page.

import { ArrowRight } from 'lucide-react';
import CircuitFrame from '../circuits/CircuitFrame';
import { useThemeQs } from '@/lib/stage-theme';

const MONO = "'Manrope', ui-monospace, SFMono-Regular, Menlo, monospace";
const ORDER = ['United States', 'Sports', 'World'];

export default function CloserHub({ h1, quizzes, faq }) {
  const tq = useThemeQs();
  const withTq = (href) => (tq ? href + (href.includes('?') ? tq : `?${tq.slice(1)}`) : href);
  const groups = ORDER.map((k) => [k, quizzes.filter((q) => q.kind === k)]).filter(([, l]) => l.length);
  const first = quizzes.find((q) => q.id === 'closer-us-cities') || quizzes[0];
  return (
    <CircuitFrame cat="Geography" label="Which Is Closer" wide>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wic">
        <section>
          <nav className="wic-crumb" aria-label="Breadcrumb">
            <a href={withTq('/geography-games')}>Geography Games</a>
            <span aria-hidden="true">/</span>
            <span>Which Is Closer</span>
          </nav>
          <div className="wic-hrow">
            <div className="wic-htext">
              <h1 className="wic-h1">{h1}</h1>
              <p className="wic-sub">{quizzes.length} quizzes · fifteen rounds each · free, no signup</p>
            </div>
            {first ? <a className="wic-go" href={withTq(`/quiz/${first.id}`)}>Start with {first.name} <ArrowRight size={15} strokeWidth={2.6} /></a> : null}
          </div>
          <p className="wic-lede">
            One place, two others, and one question: which of the two is closer to it as the crow flies? Every round reveals the real mileage, so you learn where things sit as you play. A map flattens the globe, which is why so many of these feel like coin-flips until the numbers come up.
          </p>
        </section>

        <section className="wic-list" aria-label="The quizzes">
          {groups.map(([k, list]) => (
            <div key={k} className="wic-g">
              <div className="wic-gh"><h2>{k}</h2><b>{list.length}</b></div>
              <ul>
                {list.map((q) => (
                  <li key={q.id}>
                    <a className="wic-row" href={withTq(`/quiz/${q.id}`)}>
                      <span className="wic-id">
                        <b>{q.name}</b>
                        <span className="wic-n">{q.rounds} rounds</span>
                      </span>
                      <span className="wic-bl">{q.blurb}</span>
                      <span className="wic-cta">Play</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {faq && faq.length ? (
          <section className="wic-faq">
            <h2>Questions</h2>
            {faq.map(([q, a], i) => (
              <details key={q} open={i === 0}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
        ) : null}

        <nav className="wic-more" aria-label="More geography">
          <h2>More geography</h2>
          <div>
            <a href={withTq('/geography-games')}>Geography games</a>
            <a href={withTq('/quizzes/all')}>All quizzes</a>
            <a href={withTq('/')}>Today&apos;s puzzles</a>
          </div>
        </nav>
      </div>
    </CircuitFrame>
  );
}

// NOTE: a JS template literal, so no backticks and no apostrophes in comments.
const CSS = `
.wic{display:flex;flex-direction:column;gap:28px;}
.wic-crumb{display:flex;gap:8px;font-family:${MONO};font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--stg-mute);margin-bottom:10px;}
.wic-crumb a{color:var(--stg-ink2);text-decoration:none;}
.wic-crumb a:hover{color:var(--stg-acc-ink);}
.wic-hrow{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px 24px;}
.wic-htext{flex:1 1 420px;min-width:0;}
.wic-h1{margin:0;font-size:clamp(28px,4vw,40px);font-weight:800;letter-spacing:-0.025em;line-height:1.06;color:var(--stg-ink);text-wrap:balance;}
.wic-sub{margin:8px 0 0;font-size:14.5px;font-weight:600;color:var(--stg-ink2);}
.wic-go{display:inline-flex;align-items:center;gap:8px;border-radius:10px;padding:0 16px;height:44px;font-size:13.5px;font-weight:800;text-decoration:none;
  background:var(--stg-acc);color:var(--stg-onramp,#08222e);}
.wic-go:hover{filter:brightness(1.07);}
.wic-lede{margin:16px 0 0;max-width:760px;font-size:15.5px;line-height:1.6;font-weight:500;color:var(--stg-ink2);}
.wic a:focus-visible{outline:2px solid var(--stg-acc-ink, var(--stg-acc));outline-offset:3px;}
.wic-list{border:1px solid var(--stg-line);border-radius:12px;background:var(--stg-surf);overflow:hidden;}
.wic-gh{display:flex;align-items:baseline;gap:10px;padding:12px 18px;}
.wic-g+.wic-g .wic-gh{border-top:1px solid var(--stg-line);}
.wic-gh h2{margin:0;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--stg-ink);}
.wic-gh b{font-family:${MONO};font-size:11.5px;font-weight:700;color:var(--stg-ink2);}
.wic-list ul{list-style:none;margin:0;padding:0;}
.wic-row{display:grid;grid-template-columns:minmax(150px,.8fr) minmax(0,2.2fr) auto;align-items:center;gap:16px;padding:12px 18px;
  border-top:1px solid var(--stg-line);text-decoration:none;color:var(--stg-ink);}
.wic-row:hover{background:var(--stg-surf2,var(--stg-chip));}
.wic-row:hover .wic-cta{border-color:var(--stg-acc-ink, var(--stg-acc));}
.wic-id{min-width:0;}
.wic-id b{display:block;font-size:16px;font-weight:800;letter-spacing:-0.015em;line-height:1.2;}
.wic-n{display:block;margin-top:2px;font-family:${MONO};font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-acc-ink, var(--stg-acc));}
.wic-bl{min-width:0;font-size:13px;line-height:1.45;font-weight:500;color:var(--stg-mute);}
.wic-cta{flex:none;display:inline-flex;align-items:center;justify-content:center;min-width:68px;height:36px;padding:0 12px;border-radius:9px;
  border:1.5px solid var(--stg-line2);font-size:13px;font-weight:800;color:var(--stg-acc-ink, var(--stg-acc));}
@media (max-width:720px){
  .wic-row{grid-template-columns:minmax(0,1fr) auto;gap:10px;}
  .wic-bl{display:none;}
}
.wic-faq h2,.wic-more h2{margin:0 0 12px;font-size:20px;font-weight:800;letter-spacing:-0.01em;color:var(--stg-ink);}
.wic-faq details{border-top:1px solid var(--stg-line);padding:12px 0;}
.wic-faq summary{cursor:pointer;font-size:15px;font-weight:800;color:var(--stg-ink);}
.wic-faq p{margin:8px 0 0;font-size:14.5px;line-height:1.6;color:var(--stg-ink2);}
.wic-more div{display:flex;flex-wrap:wrap;gap:8px;}
.wic-more a{font-size:13px;font-weight:700;color:var(--stg-ink2);text-decoration:none;border:1px solid var(--stg-line);border-radius:8px;padding:8px 12px;background:var(--stg-surf);}
.wic-more a:hover{color:var(--stg-ink);border-color:var(--stg-line2);}
`;
