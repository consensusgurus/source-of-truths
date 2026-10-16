'use client';

// The door from the Jig page to the puzzle shelf (/jig/shelf), under the board
// above How to play and Report an issue (owner, 2026-10-16). It draws the last
// four past boxes on a plank and today's question mark, so it looks like the
// page it opens. Colours read the stage tokens with navy fallbacks, because the
// same client also renders on the older Loft page.
const thumb = (n) => `/api/jig/img?n=${n}&w=330`;

export default function ShelfLink({ puzzles, todayNum }) {
  const past = (puzzles || []).filter((p) => p.num < todayNum).slice(-4);
  const count = (puzzles || []).filter((p) => p.num <= todayNum).length;
  return (
    <a className="jgs-link" href="/jig/shelf">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <span className="jgs-shelf" aria-hidden="true">
        <span className="jgs-plank" />
        {past.map((p) => (
          <span key={p.num} className="jgs-box"><img src={thumb(p.num)} alt="" loading="lazy" decoding="async" /></span>
        ))}
        <span className="jgs-box jgs-q">?</span>
      </span>
      <span className="jgs-txt">
        <b>Open the puzzle shelf</b>
        <span>{count} photos so far. Play any past Jig from the archive.</span>
      </span>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </a>
  );
}

const CSS = `
.jgs-link{display:flex;align-items:center;gap:16px;max-width:620px;margin:0 auto 18px;padding:12px 16px;border-radius:12px;
  text-decoration:none;background:var(--stg-surf,rgba(255,255,255,.06));border:1px solid var(--stg-line,rgba(255,255,255,.16));
  color:var(--stg-ink,#ffffff);text-align:left;box-sizing:border-box;}
.jgs-link:hover{background:var(--stg-surf2,rgba(255,255,255,.1));}
.jgs-link svg{flex:none;color:var(--stg-acc-ink,var(--stg-acc,#9cc0ff));}
.jgs-shelf{position:relative;flex:none;display:flex;gap:5px;align-items:flex-end;padding-bottom:7px;}
.jgs-plank{position:absolute;left:-4px;right:-4px;bottom:0;height:7px;background:#8a6440;border-top:2px solid #a87d55;border-radius:1px;}
.jgs-box{position:relative;display:block;width:44px;height:30px;border-radius:2px;overflow:hidden;background:#1b2436;box-shadow:2px 2px 0 rgba(5,7,13,.55);}
.jgs-box img{width:100%;height:100%;object-fit:cover;display:block;}
.jgs-q{display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#ffffff;background:#1b2c52;
  box-shadow:0 0 0 2px var(--stg-acc,#2f6fe4), 2px 2px 0 rgba(5,7,13,.55);}
.jgs-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.jgs-txt b{font-size:16px;font-weight:800;}
.jgs-txt span{font-size:13px;font-weight:600;color:var(--stg-ink2,rgba(255,255,255,.75));}
@media (max-width:520px){
  .jgs-link{flex-wrap:wrap;gap:10px;}
  .jgs-box{width:38px;height:26px;}
  .jgs-txt{flex-basis:calc(100% - 40px);}
}
`;
