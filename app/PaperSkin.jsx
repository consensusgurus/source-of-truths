// PaperSkin — the "whitewash": the One Surface treatment applied ON TOP of an
// existing page rather than as a replacement for it.
//
// WHY IT IS A SKIN AND NOT A REWRITE. The alternative was a second copy of each
// page in the new look, which is the arrangement this repo has been bitten by
// repeatedly (see the mirror notes in CLAUDE.md: getSources and its three
// mirrors, buildLeaderboard and scoreGame, LoftFinish as a fifth mirror). Two
// renders of one page drift within a week. This is one render with a colour
// layer over it, so the page keeps a single source of truth for its markup and
// its behaviour, and the skin can be deleted in one commit.
//
// INERT UNLESS SWITCHED ON. Every rule below is scoped to `html.paper-skin`, so
// a page that mounts this component and does NOT get the flag renders byte for
// byte what it renders today. That is the property that makes it safe to mount
// on a live page.
//
// NOT VIEWABLE BY THE PUBLIC. The switch is `?paper=1`, the same review-flag
// convention `?loft=1` already uses (app/useLoft.js): live at the real URL,
// reachable only by someone who knows the parameter, and carried by no link on
// the site. It changes no metadata, so the canonical URL and everything a
// crawler reads stay exactly as they are.
//
// NO CLIENT COMPONENT, AND NO FLASH. useLoft reads its parameter in an effect
// and documents the cost: the page paints the old chrome for one frame first.
// That is tolerable for chrome and would be ugly for a whole ground colour, so
// this does it with a tiny inline script that runs during parse, before the
// browser paints anything below it. The stylesheet is always present and simply
// matches nothing, which is why no hydration boundary is involved at all.
//
// WHAT THE WHITEWASH ACTUALLY DOES, in the order a reader meets it:
//   1. the navy body, html and safe-area strip become the light ground
//   2. the masthead stops being a navy slab and becomes a white bar with a rule
//   3. the circuit's own navy header block loses its slab entirely and becomes
//      an identity line: a 4px accent rule, dark type, figures on the ground
//   4. every colour that was chosen to sit ON navy (the pale blues) is re-inked
//      for a light ground
//   5. NavyFrame's footer override is undone, so the shared footer goes back to
//      its own near-black ink
//
// THE ONE REAL COST, and it is not cosmetic: `body { background: var(--accent) }`
// in globals.css is what colours the iPhone status-bar dome, and that comment
// calls it load-bearing. Whitewashing the body necessarily lightens the dome and
// the Safari address bar on a skinned page. That is the honest consequence of a
// light ground and it is the thing to look at on a real phone before this rolls
// out past a preview.

const CSS = `
/* ---------- 1. the ground ---------- */
html.paper-skin{background:#fbfbfd;}
html.paper-skin body{background:#fbfbfd;color:var(--ink);}
html.paper-skin body::before{background:#fbfbfd;}

/* ---------- 2. the masthead ---------- */
html.paper-skin .qchm-r1{background:var(--white);color:var(--ink);
  border-bottom:1px solid var(--border);}
html.paper-skin .qchm-wm{color:var(--ink);}
html.paper-skin .qchm-tag{color:var(--slate);border-left-color:var(--border);}
html.paper-skin .qchm-nav a,html.paper-skin .qchm-nav button,
html.paper-skin .qchm-bt{color:var(--muted);}
html.paper-skin .qchm-nav a:hover,html.paper-skin .qchm-nav button:hover,
html.paper-skin .qchm-nav a.on,html.paper-skin .qchm-bt:hover{color:var(--ink);}
html.paper-skin .qchm-nav a.on::after{background:var(--blue);}
html.paper-skin .qchm-r2{background:var(--surface-alt);color:var(--ink);
  border-bottom-color:var(--blue);}
html.paper-skin .qchm-cell{border-right-color:var(--border);}
html.paper-skin .qchm-k,html.paper-skin .qchm-ch,
html.paper-skin .qchm-v i{color:var(--slate);}
/* the gold and blue pills already read on white and are deliberately left */

/* THE MARK. QuizCommandHeader hands MindLoftMark ink="#ffffff", so on a white
   bar the roofline and the floor line vanish and only the pale brain is left.
   These are presentation attributes on the SVG, and any CSS rule outranks a
   presentation attribute, so re-inking is a selector rather than a prop. Matched
   by structure, not by attribute: the two strokes are the svg's own children and
   the brain is the one path inside the <g>. */
html.paper-skin .qchm-brand svg .mlm-house{fill:var(--ink);stroke:var(--ink);}

/* ---------- 3. the circuit header: slab out, identity line in ---------- */
html.paper-skin .clp-hd{background:transparent;color:var(--ink);border-radius:0;
  padding:2px 0 0 14px;overflow:visible;}
html.paper-skin .clp-hd::before{width:4px;border-radius:2px;}
html.paper-skin .clp-e{color:var(--slate);}
html.paper-skin .clp-hd.marq .clp-e{color:var(--gold-ink);}
html.paper-skin .clp-sub{color:var(--muted);}
html.paper-skin .clp-meta div i{color:var(--slate);}

/* ---------- 4. re-ink everything that was chosen against navy ---------- */
html.paper-skin .clp-sec{color:var(--slate);}
html.paper-skin .clp-note{color:var(--muted);}
html.paper-skin .clp-note a{color:var(--blue-deep);}
html.paper-skin .clp-sh{background:var(--white);color:var(--ink);
  border-color:var(--border);}
html.paper-skin .clp-sh:hover{background:var(--accent-soft);}
html.paper-skin .clp-all{border-color:var(--border);color:var(--accent);}
/* the game cards were already white; on a near-white ground the border is the
   only thing separating them, so it is lifted off --border onto something that
   still carries at this contrast */
html.paper-skin .clp-c,html.paper-skin .clp-tro{border-color:#dfe4ec;}
html.paper-skin .clp-c:hover{border-color:var(--blue);}

/* ---------- 5. undo NavyFrame's footer override ----------
   Its rules carry !important because the footer's own colours are inline, so
   these have to as well. The extra .paper-skin on the front is what outranks
   them; do not drop it and expect source order to decide. */
html.paper-skin .navy-loft footer,
html.paper-skin .navy-loft footer div,
html.paper-skin .navy-loft footer a,
html.paper-skin .navy-loft footer span{color:var(--muted) !important;}
html.paper-skin .navy-loft footer,
html.paper-skin .navy-loft footer *{border-top-color:var(--border) !important;}
`;

// Runs during parse, so the class is on <html> before anything below it paints.
//
// AND THEN KEEPS IT THERE. Setting it once is not enough and this cost a deploy
// to find: the class lands correctly, the first paint is right, and then React
// hydrates and reconciles <html> (app/layout.js renders `<html lang="en">` with
// no className of its own) and the class is gone. The page was still navy by
// the time anyone looked at it, with the script sitting in the HTML having
// genuinely run.
//
// The observer re-adds it. It cannot loop: the callback only writes when the
// class is absent, and the write it makes satisfies that condition, so the
// record it generates is a no-op. Doing it here rather than in a client
// component's effect keeps this a server component and keeps the first paint
// free of a flash.
//
// Wrapped in try/catch because a browser without URLSearchParams or
// MutationObserver must degrade to the unskinned page, not to a broken one.
const SET = "try{if(new URLSearchParams(location.search).get('paper')!=='1')throw 0;"
  + "var h=document.documentElement,c='paper-skin',"
  + "a=function(){if(!h.classList.contains(c))h.classList.add(c)};a();"
  + "new MutationObserver(a).observe(h,{attributes:true,attributeFilter:['class']})}"
  + "catch(e){}";

export default function PaperSkin() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SET }} />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </>
  );
}
