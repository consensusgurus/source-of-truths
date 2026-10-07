import { DAILY_GAME_MAP, etTodayISO } from '@/lib/daily-games';
import { decodeChallenge, challengeFig, challengeDest } from '@/lib/challenge';
import ChallengeGo from './ChallengeGo';

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
  const g = DAILY_GAME_MAP[key] || null;
  const c = decodeChallenge(raw);
  return { key, raw, g, c };
}

export function generateMetadata({ searchParams }) {
  const { key, raw, g, c } = read(searchParams);
  const base = { robots: { index: false, follow: true } };
  if (!g || !c) return { ...base, title: 'A challenge on Mind Loft', description: 'Free daily puzzles. No sign-up to play.' };
  const fig = challengeFig(c);
  // Short on purpose: a message bubble prints this under the card and wraps a
  // long one into three lines.
  const title = `${c.name}: ${fig} on ${g.name}. Can you beat it?`;
  const description = `${g.name} No. ${c.n} on Mind Loft. Same board, free, no sign-up to play.`;
  const img = `/vs/card?g=${encodeURIComponent(key)}&vs=${encodeURIComponent(raw)}`;
  return {
    ...base, title, description,
    openGraph: { title, description, images: [{ url: img, width: 1200, height: 630 }], siteName: 'Mind Loft', type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [img] },
  };
}

export default function ChallengePage({ searchParams }) {
  const { raw, g, c } = read(searchParams);
  const ok = !!(g && c);
  const href = ok ? challengeDest(g.href || `/${g.key}`, raw, c, etTodayISO()) : '/';
  const page = { minHeight: '100vh', background: '#0b0f1a', color: '#e9edf4', display: 'grid', placeItems: 'center', padding: '24px 16px', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif' };
  const card = { width: '100%', maxWidth: 460, border: '1px solid rgba(255,255,255,.11)', borderLeft: '4px solid #e8b43a', borderRadius: 12, padding: '22px 22px 24px', background: '#0e131f' };
  const eb = { fontFamily: "'DM Mono', ui-monospace, Menlo, monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#aab5c7', fontWeight: 700 };
  // THE BUTTON'S INK IS SET ON THE BUTTON. The mock-up's "Take the challenge"
  // inherited a muted grey from its parent and could not be read on the fill.
  const btn = { display: 'inline-block', marginTop: 18, background: '#7dd3fc', color: '#08222e', fontWeight: 800, fontSize: 16, textDecoration: 'none', borderRadius: 9, padding: '12px 22px' };
  return (
    <main style={page}>
      <ChallengeGo href={href} />
      <div style={card}>
        <div style={eb}>Mind Loft{ok ? ` · ${g.name} No. ${c.n}` : ''}</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, margin: '10px 0 6px' }}>
          {ok ? `${c.name} ${c.won ? 'set' : 'scored'} ${challengeFig(c)}.` : 'That challenge link did not come through whole.'}
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: '#aab5c7', fontWeight: 600 }}>
          {ok ? 'Same board, same rules. Can you beat that?' : 'You can still play today’s puzzles.'}
        </p>
        <a href={href} style={btn}>{ok ? 'Take the challenge' : 'Open Mind Loft'}</a>
      </div>
    </main>
  );
}
