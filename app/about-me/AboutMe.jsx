'use client';

// ABOUT ME (owner, 2026-11-17). Marshall's own note to players, in his words.
// Linked from the left navigation (home index and game pages) and the footer.
// It is separate from /about, which describes the site for readers and search.
import CircuitFrame from '../circuits/CircuitFrame';
import { CSS as RUN_CSS } from '../run/RunPageClient';

export default function AboutMe() {
  return (
    <CircuitFrame label="About Me" bar={{ title: 'About Me', sub: 'Mind Loft' }}>
      <style dangerouslySetInnerHTML={{ __html: RUN_CSS + CSS }} />
      <div className="br am">
        <div className="br-card br-pad am-card">
          <p>Hi, I&rsquo;m Marshall Mentz. I built and run Mind Loft from Boston, where I live with my wife and two kids.</p>
          <p>The site was inspired by my late father, Bill Mentz, who loved word puzzles. Every morning he would finish the newspaper crossword and Jumble before I was even awake.</p>
          <p>That love of puzzles rubbed off on me. Newspaper games, pub trivia, Jeopardy! and Sporcle have soaked up more hours of my life than I&rsquo;d like to admit, so building Mind Loft has been a real joy. I love watching the player count grow and hearing your feedback, good and bad, so please keep it coming.</p>
          <p>Thanks for playing. If you ever want to chat, email me at <a href="mailto:m@mindloftdaily.com">m@mindloftdaily.com</a>.</p>
        </div>
        <a className="br-go am-go" href="/">Play Today&rsquo;s Puzzles</a>
      </div>
    </CircuitFrame>
  );
}

const CSS = `
.am-card{display:flex;flex-direction:column;gap:14px;padding:22px 22px 24px;}
.am-card p{margin:0;font-size:16px;font-weight:600;line-height:1.6;color:var(--stg-ink);}
.am-card a{color:var(--stg-ink);font-weight:800;text-decoration:underline;text-underline-offset:3px;}
.am-go{text-decoration:none;text-align:center;}
`;
