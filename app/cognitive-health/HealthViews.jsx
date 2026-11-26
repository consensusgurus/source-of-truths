'use client';

// THE BODIES OF /cognitive-health AND /cognitive-health/<slug> (owner,
// 2026-11-26). Client components only because CircuitFrame's stylesheet is
// repaired on the client when a client parent renders it (same reason as
// app/guides/GuideViews.jsx). Every word arrives as props from the server
// page, so the full article is in the server HTML for a crawler. Content and
// the honesty rule live in lib/cognitive-health.js.

import { ArrowRight } from 'lucide-react';
import CircuitFrame from '../circuits/CircuitFrame';
import { useThemeQs } from '@/lib/stage-theme';

const MONO = "'Manrope', ui-monospace, SFMono-Regular, Menlo, monospace";

function useTq() {
  const tq = useThemeQs();
  return (href) => (tq ? href + (href.includes('?') ? tq : `?${tq.slice(1)}`) : href);
}

const fmtDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function HealthHub({ h1, lede, note, groups, updated }) {
  const withTq = useTq();
  return (
    <CircuitFrame label="Cognitive Health" wide>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ch">
        <section>
          <nav className="ch-crumb" aria-label="Breadcrumb">
            <a href={withTq('/')}>Mind Loft</a>
            <span aria-hidden="true">/</span>
            <span>Cognitive Health</span>
          </nav>
          <h1 className="ch-h1">{h1}</h1>
          <p className="ch-lede">{lede}</p>
          <p className="ch-meta">Updated {fmtDate(updated)}</p>
        </section>
        <section className="ch-list" aria-label="Articles">
          {groups.map(([aud, list]) => (
            <div key={aud} className="ch-g">
              <div className="ch-gh"><h2>{aud === 'Everyone' ? 'Start Here' : `For ${aud}`}</h2><b>{list.length}</b></div>
              <ul>
                {list.map((a) => (
                  <li key={a.slug}>
                    <a className="ch-row" href={withTq(`/cognitive-health/${a.slug}`)}>
                      <span className="ch-id">
                        <b>{a.short}</b>
                        <span className="ch-n">{a.minutes} min read</span>
                      </span>
                      <span className="ch-bl">{a.description}</span>
                      <span className="ch-cta">Read</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        <p className="ch-note">{note}</p>
      </div>
    </CircuitFrame>
  );
}

export function HealthArticle({ a, play, related, note, updated }) {
  const withTq = useTq();
  return (
    <CircuitFrame label="Cognitive Health" wide>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <article className="ch ch-art">
        <header>
          <nav className="ch-crumb" aria-label="Breadcrumb">
            <a href={withTq('/cognitive-health')}>Cognitive Health</a>
            <span aria-hidden="true">/</span>
            <span>{a.short}</span>
          </nav>
          <h1 className="ch-h1">{a.h1}</h1>
          <p className="ch-meta">{a.audience.join(', ')} · {a.minutes} min read · Updated {fmtDate(updated)}</p>
          <p className="ch-lede">{a.intro}</p>
        </header>

        {a.sections.map(([h, paras]) => (
          <section key={h}>
            <h2>{h}</h2>
            {paras.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
          </section>
        ))}

        <section className="ch-bottom">
          <h2>The Bottom Line</h2>
          <p>{a.bottomLine}</p>
        </section>

        {play.length ? (
          <section>
            <h2>Puzzles to Try</h2>
            <p>Free, new every day, and no sign-up. Play them because they are fun and keep you learning.</p>
            <div className="ch-btns">
              {play.map((g, i) => (
                <a key={g.href} className={i === 0 ? 'ch-go' : 'ch-alt'} href={withTq(g.href)}>
                  {g.name}: {g.blurb}{i === 0 ? <ArrowRight size={15} strokeWidth={2.6} /> : null}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="ch-src">
          <h2>Sources</h2>
          <ol>
            {a.sources.map(([label, url]) => (
              <li key={url + label}><a href={url} target="_blank" rel="noopener noreferrer">{label}</a></li>
            ))}
          </ol>
        </section>

        <p className="ch-note">{note}</p>

        <nav className="ch-more" aria-label="More articles">
          <h2>Keep Reading</h2>
          <div>
            {related.map((r) => <a key={r.slug} href={withTq(`/cognitive-health/${r.slug}`)}>{r.short}</a>)}
            <a href={withTq('/cognitive-health')}>All cognitive health articles</a>
          </div>
        </nav>
      </article>
    </CircuitFrame>
  );
}

// NOTE: a JS template literal, so no backticks and no apostrophes in comments.
const CSS = `
.ch{display:flex;flex-direction:column;gap:26px;}
.ch-art{max-width:760px;}
.ch-crumb{display:flex;gap:8px;font-family:${MONO};font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--stg-mute);margin-bottom:10px;}
.ch-crumb a{color:var(--stg-ink2);text-decoration:none;}
.ch-crumb a:hover{color:var(--stg-acc-ink);}
.ch-h1{margin:0;font-size:clamp(27px,4vw,38px);font-weight:800;letter-spacing:-0.025em;line-height:1.14;color:var(--stg-ink);text-wrap:balance;padding-bottom:2px;}
.ch-meta{margin:10px 0 0;font-size:12.5px;font-weight:700;color:var(--stg-mute);}
.ch-lede{margin:14px 0 0;max-width:760px;font-size:16px;line-height:1.62;font-weight:500;color:var(--stg-ink2);}
.ch a:focus-visible{outline:2px solid var(--stg-acc-ink, var(--stg-acc));outline-offset:3px;}
.ch-art section>h2,.ch-more h2{margin:0 0 10px;font-size:21px;font-weight:800;letter-spacing:-0.01em;line-height:1.25;color:var(--stg-ink);}
.ch-art section>p{margin:0 0 12px;font-size:15.5px;line-height:1.7;font-weight:500;color:var(--stg-ink2);}
.ch-bottom{border:1px solid var(--stg-line);border-radius:12px;background:var(--stg-surf);padding:18px;}
.ch-bottom>p{margin:0 !important;color:var(--stg-ink) !important;font-weight:600 !important;}
.ch-btns{display:flex;flex-direction:column;align-items:flex-start;gap:10px;}
.ch-go{display:inline-flex;align-items:center;gap:8px;border-radius:10px;padding:10px 16px;min-height:44px;font-size:13.5px;font-weight:800;text-decoration:none;
  background:var(--stg-acc);color:var(--stg-onramp,#08222e);}
.ch-go:hover{filter:brightness(1.07);}
.ch-alt{display:inline-flex;align-items:center;min-height:44px;padding:10px 14px;border-radius:10px;border:1px solid var(--stg-line2);font-size:13px;font-weight:700;text-decoration:none;color:var(--stg-ink);}
.ch-alt:hover{border-color:var(--stg-acc-ink, var(--stg-acc));}
.ch-src ol{margin:0;padding:0 0 0 20px;}
.ch-src li{margin:0 0 8px;font-size:13.5px;line-height:1.5;color:var(--stg-ink2);}
.ch-src a{color:var(--stg-ink2);text-decoration:underline;text-underline-offset:2px;}
.ch-src a:hover{color:var(--stg-ink);}
.ch-note{margin:0;font-size:12.5px;line-height:1.6;font-weight:500;color:var(--stg-mute);border-top:1px solid var(--stg-line);padding-top:14px;max-width:760px;}
.ch-list{border:1px solid var(--stg-line);border-radius:12px;background:var(--stg-surf);overflow:hidden;}
.ch-gh{display:flex;align-items:baseline;gap:10px;padding:12px 18px;}
.ch-g+.ch-g .ch-gh{border-top:1px solid var(--stg-line);}
.ch-gh h2{margin:0;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--stg-ink);}
.ch-gh b{font-family:${MONO};font-size:11.5px;font-weight:700;color:var(--stg-ink2);}
.ch-list ul{list-style:none;margin:0;padding:0;}
.ch-row{display:grid;grid-template-columns:minmax(190px,.9fr) minmax(0,2.1fr) auto;align-items:center;gap:16px;padding:12px 18px;
  border-top:1px solid var(--stg-line);text-decoration:none;color:var(--stg-ink);}
.ch-row:hover{background:var(--stg-surf2,var(--stg-chip));}
.ch-row:hover .ch-cta{border-color:var(--stg-acc-ink, var(--stg-acc));}
.ch-id{min-width:0;}
.ch-id b{display:block;font-size:16px;font-weight:800;letter-spacing:-0.015em;line-height:1.3;}
.ch-n{display:block;margin-top:2px;font-family:${MONO};font-size:9px;font-weight:700;letter-spacing:.12em;line-height:1.5;text-transform:uppercase;color:var(--stg-acc-ink, var(--stg-acc));}
.ch-bl{min-width:0;font-size:13px;line-height:1.45;font-weight:500;color:var(--stg-mute);}
.ch-cta{flex:none;display:inline-flex;align-items:center;justify-content:center;min-width:68px;height:36px;padding:0 12px;border-radius:9px;
  border:1.5px solid var(--stg-line2);font-size:13px;font-weight:800;color:var(--stg-acc-ink, var(--stg-acc));}
@media (max-width:720px){
  .ch-row{grid-template-columns:minmax(0,1fr) auto;gap:10px;}
  .ch-bl{display:none;}
}
.ch-more div{display:flex;flex-wrap:wrap;gap:8px;}
.ch-more a{font-size:13px;font-weight:700;color:var(--stg-ink2);text-decoration:none;border:1px solid var(--stg-line);border-radius:8px;padding:8px 12px;background:var(--stg-surf);}
.ch-more a:hover{color:var(--stg-ink);border-color:var(--stg-line2);}
`;
