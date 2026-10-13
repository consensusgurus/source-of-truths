// The homepage's About block: what the site is, a link to every puzzle
// category page, and the FAQ that app/page.js also emits as JSON-LD. All the
// copy lives in lib/home-about.js. Static: no state, no effects, so the server
// HTML is exactly what hydrates.
import { HOME_ABOUT_LEAD, HOME_ABOUT_LINKS, HOME_FAQ } from '@/lib/home-about';

const CSS = `
/* CENTRED on the page (owner, 2026-10-09): the block sat flush left under a
   full-width home and read as an orphan. */
.sty-about.sty-about{max-width:880px;margin-left:auto;margin-right:auto;text-align:center;}
.sty-about .sty-cathead{justify-content:center;}
.sty-about ul.sty-alinks{justify-content:center;}
.sty-about p{margin:0 0 10px;font-size:14.5px;line-height:1.6;color:var(--stg-ink2);}
.sty-about h3{margin:18px 0 8px;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--stg-ink);}
.sty-about ul.sty-alinks{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px;}
.sty-about ul.sty-alinks a{display:inline-block;padding:5px 11px;border:1px solid var(--stg-line);border-radius:999px;
  background:var(--stg-surf);color:var(--stg-ink);font-size:13px;font-weight:600;text-decoration:none;}
.sty-about ul.sty-alinks a:hover{border-color:var(--stg-ink2);}
.sty-about dl{margin:0;}
.sty-about dt{margin:12px 0 3px;font-size:14px;font-weight:700;color:var(--stg-ink);}
.sty-about dd{margin:0;font-size:14px;line-height:1.55;color:var(--stg-ink2);}
`;

export default function HomeAbout() {
  return (
    <section id="sty-about" className="sty-cat sty-about" style={{ '--cc': 'var(--stg-ink2)' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sty-cathead"><h2>About Mind Loft, the free daily puzzle site</h2></div>
      {HOME_ABOUT_LEAD.map((p, i) => <p key={i}>{p}</p>)}
      <h3>Browse puzzles by type</h3>
      <ul className="sty-alinks">
        {HOME_ABOUT_LINKS.map(([slug, label]) => (
          <li key={slug}><a href={`/${slug}`}>{label}</a></li>
        ))}
        <li><a href="/quizzes">Quizzes</a></li>
      </ul>
      <h3>Questions</h3>
      <dl>
        {HOME_FAQ.map(([q, a]) => (
          <div key={q}><dt>{q}</dt><dd>{a}</dd></div>
        ))}
      </dl>
    </section>
  );
}
