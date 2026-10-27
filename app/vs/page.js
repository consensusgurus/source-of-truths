import { DAILY_GAME_MAP, etTodayISO } from '@/lib/daily-games';
import { decodeChallenge, challengeFig, challengeDest, RUN_CHALLENGES, isBlankMiss } from '@/lib/challenge';
import ChallengeGo from './ChallengeGo';
import { metricDef, metricLine } from '@/lib/challenge-metric';

// THE CHALLENGE LANDING (owner, 2026-10-07). /vs?g=<key>&vs=<payload>
//
// Every game's own page.js has static metadata, so a link straight to the game
// would preview as the ordinary game card with nobody's name on it. This one
// page reads the link and writes the preview ("Gator85 solved Garble in 1:24"),
// then hands a person on to the board. See lib/challenge.js for the payload.
export const dynamic = 'force-dynamic';

function read(searchParams) {
  const one = (v) => (Array.isArray(v) ? v[0] : v) || '';
  const key = one(searchParams && searchParams.g);
  const raw = one(searchParams && searchParams.vs);
  const run = RUN_CHALLENGES[key] || null;
  const g = DAILY_GAME_MAP[key] || run;
  const c = decodeChallenge(raw);
  const cidRaw = String(one(searchParams && searchParams.c)).toLowerCase();
  const cid = /^[a-z0-9]{6,16}$/.test(cidRaw) ? cidRaw : null;
  // m=1: the link was shared beside the meme GIF, which already carries the
  // detail, so its preview is the bare Accept the challenge button.
  const meme = one(searchParams && searchParams.m) === '1';
  // t=d: the sharer was on the dark register, so the card is drawn dark.
  const dark = one(searchParams && searchParams.t) === 'd';
  return { key, raw, g, c, run, cid, meme, dark };
}

export function generateMetadata({ searchParams }) {
  const { key, raw, g, c, run, meme, dark } = read(searchParams);
  const base = { robots: { index: false, follow: true } };
  if (!g || !c) return { ...base, title: 'A challenge on Mind Loft', description: 'Free daily puzzles. No sign-up to play.' };
  const fig = challengeFig(c, key);
  // Short on purpose: a message bubble prints this under the card and wraps a
  // long one into three lines.
  const title = !run && isBlankMiss(c) ? `${c.name} could not crack ${g.name}. Can you?` : `${c.name}: ${fig} on ${g.name}. Can you beat it?`;
  const description = run
    ? `${g.name} on Mind Loft${c.x ? `: ${c.x}` : ''}. Same run, free, no sign-up to play.`
    : `${g.name} No. ${c.n} on Mind Loft. Same board, free, no sign-up to play.`;
  const img = `/vs/card?g=${encodeURIComponent(key)}&vs=${encodeURIComponent(raw)}${meme ? '&m=1' : ''}&c=3`; // c: bump when the card's look changes, so no CDN copy of the old one is served
  // TWO PREVIEWS, NO REPEATS (owner, 2026-10-23). Beside the GIF the link says
  // only Accept the challenge, since the GIF carries the detail. Sent on its
  // own, the link carries the full sentence in its card and its title.
  // NO TEXT UNDER THE CARD (owner, 2026-10-25): the image carries the whole
  // message, so the title a bubble prints beneath it is only the site name.
  const share = 'Mind Loft';
  return {
    ...base, title, description,
    openGraph: { title: share, description, images: [{ url: img, width: 1200, height: 630 }], siteName: 'Mind Loft', type: 'website' },
    twitter: { card: 'summary_large_image', title: share, description, images: [img] },
  };
}

export default function ChallengePage({ searchParams }) {
  const { key, raw, g, c, run, cid } = read(searchParams);
  const byMetric = !!(c && !run && c.m != null && metricDef(key));
  const ok = !!(g && c);
  const href = ok ? challengeDest(g.href || `/${g.key}`, raw, c, etTodayISO(), run ? run.archive : true) : '/';
  // NOBODY SHOULD SEE THIS PAGE (owner, 2026-10-27). A person is sent on by
  // ChallengeGo the moment the page's script runs; a link-preview crawler reads
  // only the metadata above. The card used to paint at once in the retired navy
  // look and sat there until React started, which read as an old page flashing
  // before the game. Now the page paints as the site's own ground (light, or
  // dark when the boot stamp says so) and the card fades in only if the
  // redirect has not happened after a beat: a slow or broken load still gets a
  // button. With scripts off it shows at once.
  const CSS = `
.vs-page{min-height:100vh;background:#eef1f6;color:#0b0f1a;display:grid;place-items:center;padding:24px 16px;font-family:Manrope,system-ui,-apple-system,sans-serif}
.vs-card{width:100%;max-width:460px;border:1px solid rgba(11,15,26,.10);border-radius:12px;padding:22px 22px 24px;background:#fff;opacity:0;animation:vs-in .3s ease-out 1.6s forwards}
.vs-eb{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#5b6578;font-weight:700}
.vs-sub{margin:0;font-size:15px;color:#5b6578;font-weight:600}
html[data-stage-boot='dark'] .vs-page{background:#0b0f1a;color:#e9edf4}
html[data-stage-boot='dark'] .vs-card{background:#0e131f;border-color:rgba(255,255,255,.11)}
html[data-stage-boot='dark'] .vs-eb,html[data-stage-boot='dark'] .vs-sub{color:#aab5c7}
@keyframes vs-in{to{opacity:1}}
@media (prefers-reduced-motion:reduce){.vs-card{animation-duration:.01s}}`;
  // THE BUTTON'S INK IS SET ON THE BUTTON. The mock-up's "Take the challenge"
  // inherited a muted grey from its parent and could not be read on the fill.
  const btn = { display: 'inline-block', marginTop: 18, background: '#7dd3fc', color: '#08222e', fontWeight: 800, fontSize: 16, textDecoration: 'none', borderRadius: 9, padding: '12px 22px' };
  return (
    <main className="vs-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <noscript><style>{'.vs-card{opacity:1;animation:none}'}</style></noscript>
      <ChallengeGo href={href} gameKey={ok ? key : null} cid={ok ? cid : null} />
      <div className="vs-card">
        <div className="vs-eb">Mind Loft{ok ? (run && !run.archive ? ` · ${g.name}` : ` · ${g.name} No. ${c.n}`) : ''}</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, margin: '10px 0 6px' }}>
          {ok ? (!run && isBlankMiss(c) ? `${c.name} could not crack ${g.name}.` : byMetric ? metricLine(key, c.name, g.name, challengeFig(c, key)) : `${c.name} ${c.won ? 'set' : 'scored'} ${challengeFig(c, key)}.`) : 'That challenge link did not come through whole.'}
        </h1>
        <p className="vs-sub">
          {ok ? (run ? `${c.x ? c.x + '. ' : ''}Same run, same rules. Can you beat that?` : (isBlankMiss(c) ? 'Same board, same rules. Can you crack it?' : 'Same board, same rules. Can you beat that?')) : 'You can still play today’s puzzles.'}
        </p>
        <a href={href} style={btn}>{ok ? 'Take the challenge' : 'Open Mind Loft'}</a>
      </div>
    </main>
  );
}
