'use client';

// THE BODIES OF /alternatives AND THE THREE ALTERNATIVE PAGES (owner,
// 2026-11-28). Client components for the same reason the guides are
// (app/guides/GuideViews.jsx): CircuitFrame's stylesheet is repaired on the
// client only when a client parent renders it. Every word arrives as props from
// the server page (lib/alternatives.js), so the whole page is in the server
// HTML for a crawler. See lib/alternatives.js for the copy rules.

import { ArrowRight } from 'lucide-react';
import CircuitFrame from '../circuits/CircuitFrame';
import { useThemeQs } from '@/lib/stage-theme';

const MONO = "'Manrope', ui-monospace, SFMono-Regular, Menlo, monospace";

function useTq() {
  const tq = useThemeQs();
  return (href) => (tq ? href + (href.includes('?') ? tq : `?${tq.slice(1)}`) : href);
}

export function AltHub({ hub, pages, footnote }) {
  const withTq = useTq();
  return (
    <CircuitFrame label="Alternatives" wide>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="al">
        <section>
          <nav className="al-crumb" aria-label="Breadcrumb">
            <a href={withTq('/')}>Mind Loft</a>
            <span aria-hidden="true">/</span>
            <span>Alternatives</span>
          </nav>
          <h1 className="al-h1">{hub.h1}</h1>
          <p className="al-lede">{hub.lede}</p>
        </section>
        <ul className="al-list">
          {pages.map((p) => (
            <li key={p.slug}>
              <a className="al-row" href={withTq(`/${p.slug}`)}>
                <span className="al-id">
                  <b>{p.h1}</b>
                  <span className="al-n">{p.theirs.join(', ')}</span>
                </span>
                <span className="al-cta">Read</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="al-foot">{footnote}</p>
      </div>
    </CircuitFrame>
  );
}

export function AltArticle({ page, matches, others, footnote }) {
  const withTq = useTq();
  return (
    <CircuitFrame label="Alternatives" wide>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <article className="al al-art">
        <header>
          <nav className="al-crumb" aria-label="Breadcrumb">
            <a href={withTq('/alternatives')}>Alternatives</a>
            <span aria-hidden="true">/</span>
            <span>{page.short}</span>
          </nav>
          <h1 className="al-h1">{page.h1}</h1>
          <p className="al-lede">{page.lede}</p>
          <a className="al-go" href={withTq('/')}>See today&apos;s puzzles <ArrowRight size={15} strokeWidth={2.6} /></a>
        </header>

        <section>
          <h2>Puzzle by Puzzle</h2>
          {matches.map((m) => (
            <div key={m.theirs} className="al-m">
              <h3>If You Like {m.theirs}</h3>
              <p>{m.body}</p>
              {m.links.length ? (
                <div className="al-btns">
                  {m.links.map((l, i) => (
                    <a key={l.href} className={i === 0 && l.play ? 'al-go al-go-s' : 'al-alt'} href={withTq(l.href)}>
                      {l.label}{i === 0 && l.play ? <ArrowRight size={14} strokeWidth={2.6} /> : null}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </section>

        <section>
          <h2>What Mind Loft Adds</h2>
          {page.differences.map(([t, p]) => (
            <div key={t} className="al-tip"><h3>{t}</h3><p>{p}</p></div>
          ))}
        </section>

        <section className="al-faq">
          <h2>Questions</h2>
          {page.faq.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>

        <nav className="al-more" aria-label="More">
          <h2>More</h2>
          <div>
            {others.map((o) => <a key={o.slug} href={withTq(`/${o.slug}`)}>{o.h1}</a>)}
            <a href={withTq('/guides')}>Puzzle guides</a>
            <a href={withTq('/archive')}>Puzzle archive</a>
            <a href={withTq('/')}>Today&apos;s puzzles</a>
          </div>
        </nav>
        <p className="al-foot">{footnote}</p>
      </article>
    </CircuitFrame>
  );
}

// NOTE: a JS template literal, so no backticks and no apostrophes in comments.
// Same measures as the guides (app/guides/GuideViews.jsx), 1px lines, no
// dotted or dashed borders.
const CSS = `
.al{display:flex;flex-direction:column;gap:28px;}
.al-art{max-width:760px;}
.al-crumb{display:flex;gap:8px;font-family:${MONO};font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--stg-mute);margin-bottom:10px;}
.al-crumb a{color:var(--stg-ink2);text-decoration:none;}
.al-crumb a:hover{color:var(--stg-acc-ink);}
.al-h1{margin:0;font-size:clamp(28px,4vw,40px);font-weight:800;letter-spacing:-0.025em;line-height:1.15;color:var(--stg-ink);text-wrap:balance;padding-bottom:3px;}
.al-lede{margin:14px 0 0;max-width:760px;font-size:15.5px;line-height:1.62;font-weight:500;color:var(--stg-ink2);}
.al-go{display:inline-flex;align-items:center;gap:8px;border-radius:10px;padding:0 16px;height:44px;margin-top:18px;font-size:13.5px;font-weight:800;text-decoration:none;
  background:var(--stg-acc);color:var(--stg-onramp,#08222e);line-height:1.3;}
.al-go:hover{filter:brightness(1.07);}
.al-go-s{margin-top:0;}
.al a:focus-visible{outline:2px solid var(--stg-acc-ink, var(--stg-acc));outline-offset:3px;}
.al-art section>h2,.al-faq h2,.al-more h2{margin:0 0 12px;font-size:20px;font-weight:800;letter-spacing:-0.01em;line-height:1.3;color:var(--stg-ink);}
.al-art h3{margin:0;font-size:16px;font-weight:800;line-height:1.35;color:var(--stg-ink);}
.al-art p{margin:6px 0 0;font-size:15px;line-height:1.65;font-weight:500;color:var(--stg-ink2);}
.al-m,.al-tip{padding:16px 0;border-top:1px solid var(--stg-line);}
.al-btns{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:12px;}
.al-alt{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border-radius:10px;border:1px solid var(--stg-line2);font-size:13px;font-weight:700;line-height:1.3;text-decoration:none;color:var(--stg-ink);}
.al-alt:hover{border-color:var(--stg-acc-ink, var(--stg-acc));}
.al-faq details{border-top:1px solid var(--stg-line);padding:12px 0;}
.al-faq summary{cursor:pointer;font-size:15.5px;font-weight:800;line-height:1.4;color:var(--stg-ink);}
.al-more div{display:flex;flex-wrap:wrap;gap:8px 18px;}
.al-more a{font-size:14px;font-weight:700;line-height:1.5;color:var(--stg-acc-ink, var(--stg-acc));text-decoration:none;}
.al-more a:hover{text-decoration:underline;}
.al-foot{margin:0;font-size:12.5px;line-height:1.55;font-weight:500;color:var(--stg-mute);}
.al-list{list-style:none;margin:0;padding:0;border:1px solid var(--stg-line);border-radius:12px;background:var(--stg-surf);overflow:hidden;}
.al-list li+li .al-row{border-top:1px solid var(--stg-line);}
.al-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px;text-decoration:none;color:var(--stg-ink);}
.al-row:hover{background:var(--stg-surf2,var(--stg-chip));}
.al-row:hover .al-cta{border-color:var(--stg-acc-ink, var(--stg-acc));}
.al-id{min-width:0;}
.al-id b{display:block;font-size:16px;font-weight:800;letter-spacing:-0.015em;line-height:1.35;}
.al-n{display:block;margin-top:3px;font-size:13px;font-weight:500;line-height:1.45;color:var(--stg-mute);}
.al-cta{flex:none;display:inline-flex;align-items:center;justify-content:center;min-width:68px;height:36px;padding:0 12px;border-radius:9px;
  border:1.5px solid var(--stg-line2);font-size:13px;font-weight:800;color:var(--stg-acc-ink, var(--stg-acc));}
`;
