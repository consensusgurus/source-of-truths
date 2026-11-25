'use client';

// THE BODIES OF /guides AND /guides/<slug> (owner, 2026-11-25). Client
// components for the same reason CloserHub is one: CircuitFrame's stylesheet is
// repaired on the client only when a client parent renders it. Every word
// arrives as props from the server page (lib/guides.js), so the whole guide is
// in the server HTML for a crawler. See lib/guides.js for why the guides exist
// and where they are linked from.

import { ArrowRight } from 'lucide-react';
import CircuitFrame from '../circuits/CircuitFrame';
import { useThemeQs } from '@/lib/stage-theme';

const MONO = "'Manrope', ui-monospace, SFMono-Regular, Menlo, monospace";

function useTq() {
  const tq = useThemeQs();
  return (href) => (tq ? href + (href.includes('?') ? tq : `?${tq.slice(1)}`) : href);
}

export function GuidesHub({ h1, lede, groups }) {
  const withTq = useTq();
  return (
    <CircuitFrame label="Puzzle Guides" wide>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="gd">
        <section>
          <nav className="gd-crumb" aria-label="Breadcrumb">
            <a href={withTq('/')}>Mind Loft</a>
            <span aria-hidden="true">/</span>
            <span>Puzzle Guides</span>
          </nav>
          <h1 className="gd-h1">{h1}</h1>
          <p className="gd-lede">{lede}</p>
        </section>
        <section className="gd-list" aria-label="The guides">
          {groups.map(([cat, list]) => (
            <div key={cat} className="gd-g" id={cat.toLowerCase()}>
              <div className="gd-gh"><h2>{cat}</h2><b>{list.length}</b></div>
              <ul>
                {list.map((g) => (
                  <li key={g.slug}>
                    <a className="gd-row" href={withTq(`/guides/${g.slug}`)}>
                      <span className="gd-id">
                        <b>{g.h1}</b>
                        <span className="gd-n">Then play {g.gameName}</span>
                      </span>
                      <span className="gd-bl">{g.description}</span>
                      <span className="gd-cta">Read</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        <nav className="gd-more" aria-label="More">
          <h2>More Puzzles</h2>
          <div>
            <a href={withTq('/')}>Today&apos;s puzzles</a>
            <a href={withTq('/sudoku')}>Sudoku</a>
            <a href={withTq('/logic-puzzles')}>Logic puzzles</a>
            <a href={withTq('/word-games')}>Word games</a>
            <a href={withTq('/archive')}>Puzzle archive</a>
          </div>
        </nav>
      </div>
    </CircuitFrame>
  );
}

export function GuideArticle({ guide, game, alsoGames, catHref, catLabel, more }) {
  const withTq = useTq();
  const g = guide;
  return (
    <CircuitFrame cat={game.cat} label="Puzzle Guides" wide>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <article className="gd gd-art">
        <header>
          <nav className="gd-crumb" aria-label="Breadcrumb">
            <a href={withTq('/guides')}>Puzzle Guides</a>
            <span aria-hidden="true">/</span>
            <span>{g.name}</span>
          </nav>
          <h1 className="gd-h1">{g.h1}</h1>
          <p className="gd-lede">{g.intro}</p>
          <a className="gd-go" href={withTq(game.href)}>Play today&apos;s {game.name} <ArrowRight size={15} strokeWidth={2.6} /></a>
        </header>

        <section>
          <h2>The Rules</h2>
          <ul className="gd-rules">{g.rules.map((r) => <li key={r}>{r}</li>)}</ul>
        </section>

        <section>
          <h2>Step by Step</h2>
          <ol className="gd-steps">
            {g.steps.map(([t, p]) => (
              <li key={t}><h3>{t}</h3><p>{p}</p></li>
            ))}
          </ol>
        </section>

        <section>
          <h2>Techniques and Tips</h2>
          {g.tips.map(([t, p]) => (
            <div key={t} className="gd-tip"><h3>{t}</h3><p>{p}</p></div>
          ))}
        </section>

        {g.mistakes && g.mistakes.length ? (
          <section>
            <h2>Common Mistakes</h2>
            <ul className="gd-rules">{g.mistakes.map((m) => <li key={m}>{m}</li>)}</ul>
          </section>
        ) : null}

        <section className="gd-play">
          <h2>Try It on Today&apos;s Board</h2>
          <p>{game.name} is a free daily {g.name.toLowerCase()} on Mind Loft: a new board every midnight Eastern, one solution you can reach by logic, and a daily leaderboard. No app and no signup.</p>
          <div className="gd-btns">
            <a className="gd-go" href={withTq(game.href)}>Play {game.name} <ArrowRight size={15} strokeWidth={2.6} /></a>
            {alsoGames.map((a) => <a key={a.key} className="gd-alt" href={withTq(a.href)}>{a.name}: {a.tag}</a>)}
          </div>
        </section>

        {g.faq && g.faq.length ? (
          <section className="gd-faq">
            <h2>Questions</h2>
            {g.faq.map(([q, a], i) => (
              <details key={q} open={i === 0}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
        ) : null}

        <nav className="gd-more" aria-label="More guides">
          <h2>More Guides</h2>
          <div>
            {more.map((m) => <a key={m.slug} href={withTq(`/guides/${m.slug}`)}>{m.h1}</a>)}
            {(g.related || []).map(([href, name]) => <a key={href} href={withTq(href)}>{name}</a>)}
            <a href={withTq('/guides')}>All puzzle guides</a>
            <a href={withTq(catHref)}>{catLabel}</a>
          </div>
        </nav>
      </article>
    </CircuitFrame>
  );
}

// NOTE: a JS template literal, so no backticks and no apostrophes in comments.
const CSS = `
.gd{display:flex;flex-direction:column;gap:28px;}
.gd-art{max-width:760px;}
.gd-crumb{display:flex;gap:8px;font-family:${MONO};font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--stg-mute);margin-bottom:10px;}
.gd-crumb a{color:var(--stg-ink2);text-decoration:none;}
.gd-crumb a:hover{color:var(--stg-acc-ink);}
.gd-h1{margin:0;font-size:clamp(28px,4vw,40px);font-weight:800;letter-spacing:-0.025em;line-height:1.12;color:var(--stg-ink);text-wrap:balance;padding-bottom:2px;}
.gd-lede{margin:14px 0 0;max-width:760px;font-size:15.5px;line-height:1.62;font-weight:500;color:var(--stg-ink2);}
.gd-go{display:inline-flex;align-items:center;gap:8px;border-radius:10px;padding:0 16px;height:44px;margin-top:18px;font-size:13.5px;font-weight:800;text-decoration:none;
  background:var(--stg-acc);color:var(--stg-onramp,#08222e);}
.gd-go:hover{filter:brightness(1.07);}
.gd a:focus-visible{outline:2px solid var(--stg-acc-ink, var(--stg-acc));outline-offset:3px;}
.gd-art section>h2,.gd-faq h2,.gd-more h2{margin:0 0 12px;font-size:20px;font-weight:800;letter-spacing:-0.01em;line-height:1.25;color:var(--stg-ink);}
.gd-art h3{margin:0;font-size:15.5px;font-weight:800;line-height:1.3;color:var(--stg-ink);}
.gd-art p{margin:6px 0 0;font-size:15px;line-height:1.65;font-weight:500;color:var(--stg-ink2);}
.gd-rules{margin:0;padding:0 0 0 20px;}
.gd-rules li{margin:0 0 8px;font-size:15px;line-height:1.6;font-weight:500;color:var(--stg-ink2);}
.gd-steps{margin:0;padding:0;list-style:none;counter-reset:gd;}
.gd-steps li{counter-increment:gd;position:relative;padding:12px 0 12px 44px;border-top:1px solid var(--stg-line);}
.gd-steps li::before{content:counter(gd);position:absolute;left:0;top:12px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:800;background:var(--stg-acc);color:var(--stg-onramp,#08222e);}
.gd-tip{padding:12px 0;border-top:1px solid var(--stg-line);}
.gd-play{border:1px solid var(--stg-line);border-radius:12px;background:var(--stg-surf);padding:18px;}
.gd-play .gd-go{margin-top:0;}
.gd-btns{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:14px;}
.gd-alt{display:inline-flex;align-items:center;height:44px;padding:0 14px;border-radius:10px;border:1px solid var(--stg-line2);font-size:13px;font-weight:700;text-decoration:none;color:var(--stg-ink);}
.gd-alt:hover{border-color:var(--stg-acc-ink, var(--stg-acc));}
.gd-list{border:1px solid var(--stg-line);border-radius:12px;background:var(--stg-surf);overflow:hidden;}
.gd-gh{display:flex;align-items:baseline;gap:10px;padding:12px 18px;}
.gd-g+.gd-g .gd-gh{border-top:1px solid var(--stg-line);}
.gd-gh h2{margin:0;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--stg-ink);}
.gd-gh b{font-family:${MONO};font-size:11.5px;font-weight:700;color:var(--stg-ink2);}
.gd-list ul{list-style:none;margin:0;padding:0;}
.gd-row{display:grid;grid-template-columns:minmax(180px,.9fr) minmax(0,2.1fr) auto;align-items:center;gap:16px;padding:12px 18px;
  border-top:1px solid var(--stg-line);text-decoration:none;color:var(--stg-ink);}
.gd-row:hover{background:var(--stg-surf2,var(--stg-chip));}
.gd-row:hover .gd-cta{border-color:var(--stg-acc-ink, var(--stg-acc));}
.gd-id{min-width:0;}
.gd-id b{display:block;font-size:16px;font-weight:800;letter-spacing:-0.015em;line-height:1.3;}
.gd-n{display:block;margin-top:2px;font-family:${MONO};font-size:9px;font-weight:700;letter-spacing:.12em;line-height:1.5;text-transform:uppercase;color:var(--stg-acc-ink, var(--stg-acc));}
.gd-bl{min-width:0;font-size:13px;line-height:1.45;font-weight:500;color:var(--stg-mute);}
.gd-cta{flex:none;display:inline-flex;align-items:center;justify-content:center;min-width:68px;height:36px;padding:0 12px;border-radius:9px;
  border:1.5px solid var(--stg-line2);font-size:13px;font-weight:800;color:var(--stg-acc-ink, var(--stg-acc));}
@media (max-width:720px){
  .gd-row{grid-template-columns:minmax(0,1fr) auto;gap:10px;}
  .gd-bl{display:none;}
}
.gd-faq details{border-top:1px solid var(--stg-line);padding:12px 0;}
.gd-faq summary{cursor:pointer;font-size:15px;font-weight:800;color:var(--stg-ink);}
.gd-faq p{margin:8px 0 0;font-size:14.5px;line-height:1.6;color:var(--stg-ink2);}
.gd-more div{display:flex;flex-wrap:wrap;gap:8px;}
.gd-more a{font-size:13px;font-weight:700;color:var(--stg-ink2);text-decoration:none;border:1px solid var(--stg-line);border-radius:8px;padding:8px 12px;background:var(--stg-surf);}
.gd-more a:hover{color:var(--stg-ink);border-color:var(--stg-line2);}
`;
