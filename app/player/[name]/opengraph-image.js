import { SITE_URL } from '@/lib/site';
import { renderPlayerCard } from '@/lib/og-stage-cards';
import { crownCategory, crownAccent } from '@/lib/crown';

export const runtime = 'nodejs';
export const alt = 'Mind Loft player profile';
export { size, contentType } from '@/lib/og-stage-cards';
export const dynamicParams = true;
export function generateStaticParams() { return []; }

// Best-effort live stats: the profile API is heavy, so it gets a short leash
// and the card falls back to a name-only version when it does not answer.
async function fetchProfile(name) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4500);
    const r = await fetch(`${SITE_URL}/api/quiz/player?username=${encodeURIComponent(name)}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const d = await r.json();
    return d && d.found ? d : null;
  } catch (e) { return null; }
}

// THE CARD WEARS THE PLAYER'S CROWN CATEGORY, from lib/crown.js — the same
// function the profile PAGE calls, so the card and the page it links to can
// never disagree about a player's colour. A player with no daily play has no
// crown and takes the brand step.
async function renderCard({ params }) {
  const name = decodeURIComponent((params && params.name) || '');
  const p = await fetchProfile(name);
  const crown = p ? crownCategory(p.recent) : null;
  const accent = crownAccent(crown);
  return renderPlayerCard({
    name: name || 'Mind Loft',
    hue: accent.dark,
    crown: crown ? crown + ' player' : null,
    tier: p ? p.tier : null,
    level: p ? p.level : null,
    rank: p ? p.rank : null,
    totalPlayers: p ? p.totalPlayers : null,
    xp: p ? p.xp : null,
    trophies: p && p.trophies ? p.trophies.earnedCount : null,
    trophyTotal: p && p.trophies ? p.trophies.total : null,
    daysPlayed: p && p.activity ? p.activity.daysPlayed : null,
    correct: p && p.activity ? p.activity.correct : null,
  });
}


// A Satori render that throws used to surface as a 500, which is how these
// routes became every one of Search Console's server errors. Fall back to the
// baked card in public/og/ instead: a generic share image beats an error.
export default async function Image(ctx) {
  try {
    return await renderCard(ctx);
  } catch (err) {
    console.error('share card failed, serving /og/brand.png', err);
    return new Response(null, { status: 302, headers: { Location: '/og/brand.png' } });
  }
}
