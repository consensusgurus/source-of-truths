'use client';

// THE STAGE ROOT FOR THE SPORTS RANKING PAGES.
//
// /nflrankings and /collegefootballrankings were the last two surfaces on the
// old chrome: a white page painted with T.white / T.ink inline, so they could
// not follow the reader's register at all while every other page on the site
// had moved to the stage. This is what puts them on it.
//
// IT IS A CLIENT COMPONENT WRAPPING SERVER CHILDREN, and that shape is the
// whole point. The register lives in localStorage, so the element that carries
// `data-stage-theme` has to be a client component (same reason StageTail is
// one). But the ranking itself must stay in the server HTML: the board IS the
// page as far as a search engine is concerned, and GridironTable is a server
// component precisely so the table ships as markup rather than being assembled
// by script. Passing the page body through as `children` keeps both: this
// component renders the root and the shell CSS, and everything inside it is
// still server-rendered.
//
// The register itself needs no work here. `.stage-page` carries the dark token
// set and `[data-stage-theme='light']` overrides it, both already in
// globals.css, and app/layout.js has stamped `data-stage-boot` on <html>
// before first paint, so there is no light flash on a reader who chose dark.
// Every rule below therefore reads --stg-* and never names a register.
import { useStageTheme } from '@/lib/stage-theme';

export default function RankingsStage({ children }) {
  const [theme] = useStageTheme();
  return (
    <div className="stage-page rk-page" data-stage-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {children}
    </div>
  );
}

// No backtick may appear anywhere in this string, comments included: one closes
// the template literal and the build fails pointing somewhere else entirely.
const SANS = "'Manrope',system-ui,-apple-system,sans-serif";
const MONO = "'Manrope',ui-monospace,SFMono-Regular,Menlo,monospace";

const CSS = `
.rk-page{min-height:100vh;background:var(--stg-ground,#0b0f1a);color:var(--stg-ink,#e9edf4);
  font-family:${SANS};}
.rk-col{max-width:1440px;margin:0 auto;padding:22px 20px 46px;}

.rk-head{padding-bottom:15px;margin-bottom:18px;border-bottom:1px solid var(--stg-line);}
.rk-head h1{font-family:${SANS};font-weight:800;font-size:clamp(25px,4.6vw,40px);line-height:1.03;
  letter-spacing:-.03em;margin:0;color:var(--stg-ink);text-wrap:balance;}
.rk-head h1 span{color:var(--stg-acc-ink);}
.rk-lede{margin:11px 0 0;max-width:66ch;font-size:14.5px;line-height:1.6;color:var(--stg-ink2);}

/* The what-changed line. A chip rather than a sentence in the lede, because it
   is about the BOARD rather than about the sport, and it is the one thing on
   the page that a returning reader is looking for. */
.rk-stamp{margin:12px 0 0;display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;
  font-size:12.5px;line-height:1.6;color:var(--stg-ink2);max-width:76ch;}
.rk-stamp i{font-style:normal;font-family:${MONO};font-size:9px;letter-spacing:.15em;
  text-transform:uppercase;color:var(--stg-onramp);background:var(--stg-acc);
  border-radius:99px;padding:3px 9px;flex:none;position:relative;top:-1px;}
.rk-stamp b{color:var(--stg-ink);font-weight:700;}

.rk-acts{margin-top:17px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
.rk-btn{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:800;
  padding:10px 16px;border-radius:9px;text-decoration:none;}
.rk-btn.p{background:var(--stg-acc);color:var(--stg-onramp);border:1px solid var(--stg-acc);}
.rk-btn.s{background:none;color:var(--stg-ink);border:1px solid var(--stg-line2);}
.rk-btn.s:hover{border-color:var(--stg-line3);}
.rk-btn:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.rk-fine{font-family:${MONO};font-size:10px;letter-spacing:.06em;color:var(--stg-mute2);}

.rk-weeks{margin:0 0 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.rk-weeks-l{font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:var(--stg-mute2);}
.rk-weeks-row{display:flex;gap:6px;flex-wrap:wrap;}
.rk-wk{display:inline-flex;align-items:baseline;gap:7px;padding:6px 11px;border-radius:8px;text-decoration:none;
  border:1px solid var(--stg-line2);color:var(--stg-ink);background:none;}
.rk-wk b{font-size:14px;font-weight:800;}
.rk-wk small{font-family:${MONO};font-size:10px;letter-spacing:.04em;color:var(--stg-mute);}
.rk-wk:hover{border-color:var(--stg-line3);}
.rk-wk.on{background:var(--stg-acc);border-color:var(--stg-acc);color:var(--stg-onramp);}
.rk-wk.on small{color:var(--stg-onramp);}
.rk-wk:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.rk-cross{margin-top:20px;font-size:12.5px;line-height:1.7;color:var(--stg-ink2);max-width:76ch;}
.rk-cross a{color:var(--stg-acc-ink);font-weight:700;}

@media(max-width:560px){
  .rk-col{padding:16px 13px 30px;}
  .rk-acts .rk-btn{flex:1 1 auto;justify-content:center;}
  .rk-fine{display:none;}
}
`;
