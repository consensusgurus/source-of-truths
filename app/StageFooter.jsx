'use client';

// THE STAGE'S FOOTER, drawn ONCE.
//
// app/Footer.jsx is the site's shared footer and it is near-black ink on a
// hairline of rgba(20,22,28,0.12): correct on a light page, invisible on the
// stage's dark register. The stage home solved that by drawing its own, which
// was right, and then the circuit pages needed the same thing — at which point
// there were two drawings of one object, which is the failure this codebase
// warns about on every other shared surface.
//
// So the drawing lives here and both render it. What is NOT duplicated, and
// must never be, is the LINK MAP: FOOTER_COLS is imported from app/Footer.jsx,
// so a link added to the site's footer appears on the stage without anyone
// remembering to add it twice.
//
// VISITORS ARE OPTIONAL AND LAZY. A caller that already counts them (the stage
// home fetches /api/visitors alongside its topics, off one observer) passes the
// figure in and this component asks for nothing. A caller that does not simply
// omits the prop, and the count is fetched when the footer comes within 600px
// of the viewport, so a reader who never scrolls pays nothing for it. Absent
// IntersectionObserver the fetch is eager: degrading to the old behaviour is
// fine, rendering a permanently empty figure is not.
import { useEffect, useRef, useState } from 'react';
import MindLoftMark from './MindLoftMark';
import { FOOTER_COLS } from './Footer';
import DailyRoster from './DailyRoster';

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = 'Manrope, ui-sans-serif, system-ui, -apple-system, sans-serif';

export default function StageFooter({ visitors: given }) {
  const owns = given === undefined;
  const [own, setOwn] = useState(null);
  const [near, setNear] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!owns) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return undefined; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); }
    }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [owns]);

  useEffect(() => {
    if (!owns || !near) return undefined;
    let alive = true;
    fetch('/api/visitors')
      .then((r) => r.json())
      .then((d) => { if (alive && d && typeof d.visitors === 'number') setOwn(d.visitors); })
      .catch(() => {});
    return () => { alive = false; };
  }, [owns, near]);

  const visitors = owns ? own : given;

  return (
    <footer className="stgf" ref={ref}>
      {/* dangerouslySetInnerHTML, never a text child: React escapes an
          apostrophe on the server and <style> is a raw-text element, so the
          font stack would ship as &#x27;JetBrains Mono&#x27; and the rule would
          be dropped. See the note in app/circuits/CircuitFrame.jsx. */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="stgf-in">
        <div className="stgf-brandcol">
          <span className="stgf-brand">
            <MindLoftMark size={19} ink="var(--stg-ink)" accent="var(--stg-brand,#7dd3fc)" />
            <b>Mind <em>Loft</em></b>
          </span>
          <p>Sharpen your mind: daily puzzles, quizzes, and consensus Top 10 Lists for everything worth knowing.</p>
          <a className="stgf-about" href="/about">About Mind Loft</a>
          {visitors != null ? (
            <div className="stgf-vis">{visitors.toLocaleString()}<i>visitors</i></div>
          ) : null}
        </div>
        {FOOTER_COLS.map((col) => (
          <div key={col.head} className="stgf-col">
            <div className="stgf-eb">{col.head}</div>
            {col.links.map((l) => (
              l.external ? (
                <a key={l.label} href={l.href} target="_blank" rel="noopener">{l.label}</a>
              ) : (
                <a key={l.label} href={l.href}>{l.label}</a>
              )
            ))}
          </div>
        ))}
      </div>
      <DailyRoster variant="stage" />
      <div className="stgf-base">
        <span>&copy; {new Date().getFullYear()} Mind Loft</span>
        <span>As an Amazon Associate, Mind Loft earns from qualifying purchases.</span>
      </div>
    </footer>
  );
}

// NOTE: this block is a JS template literal, so no backticks in the comments.
const CSS = `
/* FULL BLEED, and it carries its own ground rather than borrowing the page's:
   a footer the same colour as the page above it with one hairline between them
   reads as the page having run out, not as a footer. One step of the surface
   ladder is enough to say it is a different thing. */
.stgf{background:var(--stg-raise);border-top:1px solid var(--stg-line);
  padding:34px 22px 22px;font-family:${SANS};}
.stgf *{box-sizing:border-box;}
/* SPREAD, because it is full bleed. Packed left, the link columns end a third
   of the way across a wide window and the footer reads as a narrow block
   sitting in an empty band. The columns keep their own gap as a floor, so a
   narrow window packs them normally instead of stretching two across it. */
.stgf-in{display:flex;flex-wrap:wrap;gap:30px 38px;align-items:flex-start;
  justify-content:space-between;}
.stgf-brand{display:flex;align-items:center;gap:8px;min-width:0;}
.stgf-brandcol{flex:1 1 250px;max-width:320px;min-width:0;}
.stgf-brandcol .stgf-brand b{font-size:15px;font-weight:800;letter-spacing:-0.01em;
  color:var(--stg-ink);}
.stgf-brandcol .stgf-brand b em{font-style:normal;color:var(--stg-brand,#7dd3fc);}
.stgf-brandcol p{margin:9px 0 0;font-size:12.5px;line-height:1.55;color:var(--stg-mute);}
.stgf-about{display:inline-block;margin-top:10px;font-size:12.5px;font-weight:800;
  color:var(--stg-ink);text-decoration:none;}
.stgf-about:hover{color:var(--stg-acc-ink);}
/* The visitor count is a FIGURE, drawn the way every other figure on the stage
   is, rather than a sentence of small grey prose. */
.stgf-vis{margin-top:14px;font-family:${MONO};font-size:13px;font-weight:700;
  font-variant-numeric:tabular-nums;color:var(--stg-ink2);}
.stgf-vis i{font-style:normal;font-size:9.5px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;
  color:var(--stg-mute2);margin-left:7px;}
.stgf-eb{font-family:${MONO};font-size:9.5px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;
  color:var(--stg-mute);margin-bottom:3px;}
.stgf-col{display:flex;flex-direction:column;gap:6px;min-width:0;}
.stgf-col a{font-size:12.5px;font-weight:600;color:var(--stg-mute);text-decoration:none;}
.stgf-col a:hover{color:var(--stg-ink);}
.stgf-col a:focus-visible,.stgf-about:focus-visible{outline:2px solid var(--stg-acc);
  outline-offset:3px;border-radius:4px;}
.stgf-base{display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;
  margin-top:26px;padding-top:14px;border-top:1px solid var(--stg-line);
  font-family:${MONO};font-size:10px;letter-spacing:.06em;color:var(--stg-mute2);}

@media (max-width:640px){
  .stgf{padding:26px 14px 20px;}
  .stgf-in{gap:22px 28px;}
  .stgf-brandcol{flex-basis:100%;max-width:none;}
  .stgf-col{flex:1 1 132px;}
}
`;
