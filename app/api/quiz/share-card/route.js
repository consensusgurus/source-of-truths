import { ImageResponse } from 'next/og';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResults } from '@/lib/quiz-results-load';
import { computeXpCached } from '@/lib/quiz-derived-cache';
import { buildProfile } from '@/lib/quiz-profile';
import { DEPT_LABEL } from '@/lib/quiz-departments';
import { SHARE_HOST } from '@/lib/site';
import { crownCategory, crownAccent } from '@/lib/crown';
import { D, markURI, stageFonts, soft } from '@/lib/og-stage-card';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Downloadable Share Stats player card (1080x1080 PNG). Mirrors the in-page
// ShareStatsModal in app/quizzes/hub/StatHubClient.jsx: overall rank, level +
// tier + IQ Points, completed/correct/accuracy with ranks, and the top-3
// categories by IQ Points. GET /api/quiz/share-card?key=u:123|a:<anon>
//
// -- THE REGISTER -----------------------------------------------------------
// This card is on the Stage's DARK register and takes its whole visual identity
// from lib/og-stage-card.js: the D palette, the mark, and the fonts read off
// disk. It is the same chrome the 1200x630 cards wear (a full-bleed band in the
// accent, the mark plus wordmark with "Loft" in the accent, a mono eyebrow, and
// a footer split between the URL and one instruction), at 1080 square.
//
// THE ACCENT IS THE PLAYER'S CROWN CATEGORY (lib/crown.js), so this card and
// the /player page it links to can never disagree about a player's colour.
//
// NO OPACITY ON INK, anywhere. Hierarchy is size and weight only, which is also
// what keeps the warm ramp steps legible when they are the accent. Anything
// filled in the accent carries D.onramp as its ink, never white.
const SZ = 1080;
const SANS = 'Manrope';
const MONO = 'Manrope'; // one typeface site-wide (owner, 2026-10-08)

// The three top-category bars are painted in the CARD'S ACCENT rather than in
// each category's own ramp step. profile.byCategory is keyed by QUIZ
// DEPARTMENTS (movies, music, gaming, sports, science, ... — see DEPT_LABEL in
// lib/quiz-departments.js), and those are a different taxonomy from the ten
// DAILY categories the ramp is indexed by (Word, Numbers, Logic, End Game,
// Trivia, Geography, Cards, Crowd Psychology, Arcade, Sudoku). Only two of the
// sixteen departments share a name with a ramp step, so mapping them would give
// two bars a real hue and hand the other fourteen the ramp's fallback, which
// reads as a colour that means something and does not. One accent for all three
// is the honest render.

function mono(extra) {
  return { display: 'flex', fontFamily: MONO, fontWeight: 700, ...(extra || {}) };
}

function textImage(msg) {
  return new ImageResponse(
    (
      <div style={{ width: SZ, height: SZ, background: D.ground, color: D.ink, fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, textAlign: 'center' }}>
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 800 }}>{msg}</div>
      </div>
    ),
    { width: SZ, height: SZ, fonts: stageFonts() }
  );
}

// The name sits in about 640px of curtain beside the rank. Manrope 800 runs
// near 0.58em a character, so 78px stops fitting past ~13 characters; step it
// down rather than let it run under the rank or out of the box. Past 26 there
// is nothing left to give, so it is cut instead: a username is not length-capped
// anywhere and one long enough would otherwise run off the card.
const NAME_MAX = 26;
function nameSize(name) {
  const n = String(name || '').length;
  if (n <= 13) return 78;
  if (n <= 18) return 62;
  return 50;
}
function cutName(name) {
  const v = String(name == null ? '' : name);
  return v.length > NAME_MAX ? `${v.slice(0, NAME_MAX - 1).trimEnd()}\u2026` : v;
}

/**
 * THE DRAWING, as a pure function of plain data. Split out from GET so the card
 * can be rendered and looked at without a database: everything above this line
 * loads data, everything below only draws.
 *
 * d = { name, tier, level, xp, rank, totalPlayers, hue, stats: [[label, value,
 *       rank]], cats: [{ label, xp, rank, frac }] }
 */
export function playerCardElement(d) {
  const hue = d.hue || D.brand;
  const capLabel = { display: 'flex', fontFamily: MONO, fontWeight: 700, fontSize: 22, color: D.mute };

  return (
    <div style={{ width: SZ, height: SZ, background: D.ground, color: D.ink, fontFamily: SANS, display: 'flex', flexDirection: 'column' }}>
      {/* the band */}
      <div style={{ display: 'flex', width: SZ, height: 14, background: D.ground, flex: 'none' }} />

      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between', padding: '48px 56px 44px' }}>
        {/* the cap */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={markURI(hue)} width={46} height={46} alt="" />
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 32, fontWeight: 800, letterSpacing: '-0.3px', marginLeft: 14 }}>
              <span style={{ display: 'flex' }}>Mind</span>
              <span style={{ display: 'flex', marginLeft: 11 }}>Loft</span>
            </div>
          </div>
          <span style={capLabel}>Player card</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* the curtain: the one filled block, in the accent, with onramp ink */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', background: soft(hue), color: D.onramp, borderRadius: 26, padding: '38px 40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 640, minWidth: 0 }}>
              <span style={{ display: 'flex', fontWeight: 800, fontSize: nameSize(cutName(d.name)), letterSpacing: '-0.04em', lineHeight: 1 }}>{cutName(d.name)}</span>
              <span style={{ display: 'flex', fontWeight: 700, fontSize: 26, marginTop: 18 }}>{d.detail}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 'none', marginLeft: 28 }}>
              <span style={{ display: 'flex', fontWeight: 800, fontSize: 112, lineHeight: 0.86, letterSpacing: '-0.04em' }}>{d.rank ? `#${Number(d.rank).toLocaleString()}` : '—'}</span>
              <span style={{ display: 'flex', fontWeight: 700, fontSize: 20, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 12 }}>
                {d.totalPlayers ? `of ${Number(d.totalPlayers).toLocaleString()} players` : 'unranked'}
              </span>
            </div>
          </div>

          {/* three stat cells, each on the Stage's left rule */}
          <div style={{ display: 'flex', marginTop: 18 }}>
            {(d.stats || []).map(([label, value, rk], i) => (
              <div
                key={label}
                style={{
                  display: 'flex', flexDirection: 'column', flexGrow: 1, flexBasis: 0,
                  background: D.surf, border: `1px solid ${D.line}`, borderLeft: `6px solid ${hue}`,
                  borderRadius: 20, padding: '26px 28px', marginLeft: i ? 16 : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ display: 'flex', fontWeight: 800, fontSize: 52, letterSpacing: '-0.02em' }}>{value}</span>
                  {rk ? <span style={mono({ fontSize: 22, color: D.mute, marginLeft: 12 })}>{`#${rk}`}</span> : null}
                </div>
                <span style={{ display: 'flex', fontFamily: MONO, fontWeight: 700, fontSize: 18, color: D.mute2, marginTop: 10 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* top categories */}
          {(d.cats || []).length ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 36 }}>
              <span style={{ display: 'flex', fontFamily: MONO, fontWeight: 700, fontSize: 20, color: D.mute }}>Top categories</span>
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 20 }}>
                {d.cats.map((c, i) => (
                  <div key={c.label} style={{ display: 'flex', flexDirection: 'column', marginTop: i ? 22 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                      <span style={{ display: 'flex', fontWeight: 700, fontSize: 30 }}>{c.label}</span>
                      <span style={mono({ fontSize: 24, color: D.ink2 })}>{`${Number(c.xp || 0).toLocaleString()} IQ · #${c.rank}`}</span>
                    </div>
                    <div style={{ display: 'flex', height: 18, background: D.surf2, borderRadius: 7 }}>
                      <div style={{ display: 'flex', width: `${Math.max(4, Math.round((c.frac || 0) * 100))}%`, height: '100%', background: hue, borderRadius: 7 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* the footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${D.line}`, paddingTop: 24 }}>
          <span style={mono({ fontSize: 22, letterSpacing: '0.04em', color: D.ink2 })}>{d.url}</span>
          <span style={mono({ fontSize: 20, color: D.ink })}>Out-Rank Me</span>
        </div>
      </div>
    </div>
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = (searchParams.get('key') || '').trim();

  let profile = null;
  try {
    const { data, error } = await loadQuizResults(supabaseAdmin);
    if (!error) { const { players } = computeXpCached(data || []); profile = buildProfile(players, key || null); }
  } catch (e) { profile = null; }

  if (!profile || !profile.found) return textImage('No stats to share yet');

  const a = profile.activity || {};
  const r = profile.ranks || {};
  const cats3 = Object.entries(profile.byCategory || {})
    .filter(([, v]) => (v.matches || 0) > 0)
    .sort((x, y) => (y[1].xp || 0) - (x[1].xp || 0))
    .slice(0, 3);
  const maxR = cats3.length ? Math.max(...cats3.map(([, v]) => v.xp || 0), 1) : 1;
  const catLabel = (k) => DEPT_LABEL[k] || k;

  const hue = crownAccent(crownCategory(profile.recent)).dark || D.brand;

  try {
    return new ImageResponse(
      playerCardElement({
        name: profile.name,
        detail: [
          (profile.tier || '').replace(/ Tier$/, ''),
          `Level ${profile.level || 1}`,
          `${Number(profile.xp || 0).toLocaleString()} IQ`,
        ].filter(Boolean).join(' · '),
        rank: profile.rank,
        totalPlayers: profile.totalPlayers,
        hue,
        stats: [
          ['Completed', a.completed != null ? String(a.completed) : '—', r.completed],
          ['Correct', a.correct != null ? Number(a.correct).toLocaleString() : '—', r.correct],
          ['Accuracy', a.accuracy != null ? `${a.accuracy}%` : '—', r.accuracy],
        ],
        cats: cats3.map(([k, v]) => ({
          label: catLabel(k),
          xp: v.xp || 0,
          rank: v.rank,
          frac: (v.xp || 0) / maxR,
        })),
        url: `${SHARE_HOST}/player/${profile.name}`,
      }),
      // CDN-cache the rendered card per player key so repeat shares and
      // crawler fetches stop re-reading quiz_results (egress fix 2026-07-12).
      { width: SZ, height: SZ, fonts: stageFonts(), headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' } }
    );
  } catch (e) {
    return textImage('Mind Loft');
  }
}
